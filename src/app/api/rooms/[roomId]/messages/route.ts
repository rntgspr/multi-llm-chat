import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRoom } from '@/services/rooms/room-manager'
import {
  createMessage,
  getRoomMessages,
  createTextContent,
  createImageContent,
  createFileContent,
} from '@/services/messages/message-manager'
import {
  decideRouting,
  type OrchestratorMessage,
} from '@/services/orchestrator/orchestrator-client'
import { sendToAssistant, type ChatMessage } from '@/services/assistants/ollama-client'
import type { MessageContent } from '@/types'
import * as z from 'zod'

interface RouteParams {
  params: Promise<{ roomId: string }>
}

const contentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal('image'),
    url: z.string().url(),
    altText: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  z.object({
    type: z.literal('file'),
    url: z.string().url(),
    fileName: z.string(),
    sizeBytes: z.number(),
    mimeType: z.string(),
  }),
])

const sendMessageSchema = z.object({
  content: z.array(contentSchema).min(1),
})

/**
 * GET /api/rooms/[roomId]/messages - Lists room messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { roomId } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const room = getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (!room.participants.includes(session.user.id)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const since = searchParams.get('since')

  const messages = getRoomMessages(roomId, {
    limit,
    since: since ? new Date(since) : undefined,
    publicOnly: true,
  })

  return NextResponse.json({ messages })
}

/**
 * POST /api/rooms/[roomId]/messages - Sends a message
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { roomId } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const room = getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (!room.participants.includes(session.user.id)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { content } = sendMessageSchema.parse(body)

    const formattedContent: MessageContent[] = content.map((c) => {
      switch (c.type) {
        case 'text':
          return createTextContent(c.text)
        case 'image':
          return createImageContent(c.url, c.altText, c.width, c.height)
        case 'file':
          return createFileContent(c.url, c.fileName, c.sizeBytes, c.mimeType)
      }
    })

    // 1. Save user message
    const message = createMessage({
      roomId,
      senderId: session.user.id,
      senderType: 'user',
      content: formattedContent,
      visibility: 'public',
    })

    const userMessageText = message.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join(' ')

    // 2. Get recent messages for context
    const recentMessages = getRoomMessages(roomId, { limit: 10, publicOnly: true })

    const orchestratorMessage: OrchestratorMessage = {
      id: message.id,
      roomId: message.roomId,
      content: userMessageText,
      authorId: message.senderId,
      authorType: 'user',
      authorName: session.user.name || 'User',
      createdAt: message.createdAt,
    }

    const orchestratorHistory: OrchestratorMessage[] = recentMessages.map((m) => ({
      id: m.id,
      roomId: m.roomId,
      content: m.content.map((c) => (c.type === 'text' ? c.text : '')).join(' '),
      authorId: m.senderId,
      authorType: m.senderType === 'user' ? 'user' : 'assistant',
      authorName: m.senderType === 'user' ? 'User' : 'Assistant',
      createdAt: m.createdAt,
    }))

    // 3. Ask orchestrator which assistant should respond
    const routing = await decideRouting(
      orchestratorMessage,
      room.assistants,
      orchestratorHistory
    )

    console.log(`[API] Orchestrator decided: ${routing.assistants.join(', ')}`)

    // 4. Get response from selected assistant(s)
    const chatHistory: ChatMessage[] = recentMessages.map((m) => ({
      role: m.senderType === 'user' ? 'user' : 'assistant',
      name: m.senderType === 'user' ? 'User' : 'Assistant',
      content: m.content.map((c) => (c.type === 'text' ? c.text : '')).join(' '),
    }))

    const assistantResponses = await Promise.all(
      routing.assistants.map(async (assistantId) => {
        try {
          const responseContent = await sendToAssistant(
            assistantId,
            userMessageText,
            chatHistory
          )

          // Save assistant response
          const assistantMessage = createMessage({
            roomId,
            senderId: assistantId,
            senderType: 'assistant',
            content: [createTextContent(responseContent)],
            visibility: 'public',
          })

          return {
            assistantId,
            message: assistantMessage,
            content: responseContent,
          }
        } catch (error) {
          console.error(`[API] Error from ${assistantId}:`, error)
          return {
            assistantId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    return NextResponse.json({
      message,
      routing,
      assistantResponses,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
