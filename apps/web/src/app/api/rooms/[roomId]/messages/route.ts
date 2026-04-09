import { createFileContent, createImageContent, createTextContent, messageStore } from '@multi-llm/interaction'
import { navigator, sendToAssistant } from '@multi-llm/interpretation'
import { getRoom } from '@multi-llm/maintenance'
import { type NextRequest, NextResponse } from 'next/server'
import * as z from 'zod'

import { auth } from '@/lib/auth'

import type { MessageContent } from '@multi-llm/types'

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

  const room = await getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (!room.participants.includes(session.user.id)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const since = searchParams.get('since')

  const messages = await messageStore.getByRoom(roomId, {
    page,
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

  const room = await getRoom(roomId)

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
    const message = await messageStore.create({
      roomId,
      senderId: session.user.id,
      senderType: 'user',
      content: formattedContent,
      visibility: 'public',
    })

    const userMessageText = message.content.map((c) => (c.type === 'text' ? c.text : '')).join(' ')

    // 2. Get recent messages for context
    const recentMessages = await messageStore.getByRoom(roomId, { limit: 10, publicOnly: true })

    // 3. Ask navigator which assistant should respond
    const routing = await navigator.route(message, {
      recentMessages,
      availableAssistants: room.assistants,
      roomId,
    })

    console.log(`[API] Navigator decided: ${routing.assistants.join(', ')}`)

    // 4. Get response from selected assistant(s) sequentially
    const assistantResponses = []
    for (const assistantId of routing.assistants) {
      try {
        const responseContent = await sendToAssistant(assistantId, userMessageText, recentMessages)

        // Save assistant response
        const assistantMessage = await messageStore.create({
          roomId,
          senderId: assistantId,
          senderType: 'assistant',
          content: [createTextContent(responseContent)],
          visibility: 'public',
        })

        assistantResponses.push({
          assistantId,
          message: assistantMessage,
          content: responseContent,
        })
      } catch (error) {
        console.error(`[API] Error from ${assistantId}:`, error)
        assistantResponses.push({
          assistantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json(
      {
        message,
        routing,
        assistantResponses,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }

    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
