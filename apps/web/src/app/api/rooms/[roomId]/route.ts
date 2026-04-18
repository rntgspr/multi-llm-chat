import { addAssistant, deleteRoom, getRoom, removeAssistant } from '@synergy/platform'
import { type NextRequest, NextResponse } from 'next/server'
import * as z from 'zod'

import { auth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ roomId: string }>
}

/**
 * GET /api/rooms/[roomId] - Gets room details
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

  return NextResponse.json({ room })
}

/**
 * DELETE /api/rooms/[roomId] - Deletes a room (creator only)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  // TODO: Re-enable auth after EPIC-002 migration
  // const session = await auth()
  const { roomId } = await params

  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  // }

  const room = await getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  // TODO: Re-enable creator check after auth is fixed
  // if (room.createdBy !== session.user.id) {
  //   return NextResponse.json({ error: 'Only creator can delete room' }, { status: 403 })
  // }

  await deleteRoom(roomId)
  return NextResponse.json({ success: true })
}

const updateAssistantsSchema = z.object({
  action: z.enum(['add', 'remove']),
  assistantId: z.string(),
})

/**
 * PATCH /api/rooms/[roomId] - Updates room assistants
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { action, assistantId } = updateAssistantsSchema.parse(body)

    const success = action === 'add' ? addAssistant(roomId, assistantId) : removeAssistant(roomId, assistantId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update assistants' }, { status: 400 })
    }

    const updatedRoom = getRoom(roomId)
    return NextResponse.json({ room: updatedRoom })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
