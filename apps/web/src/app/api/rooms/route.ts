import { createRoom, listUserRooms } from '@multi-llm/maintenance'
import { type NextRequest, NextResponse } from 'next/server'
import * as z from 'zod'

import { auth } from '@/lib/auth'

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  assistants: z.array(z.string()).optional().default([]),
})

/**
 * GET /api/rooms - Lists rooms for authenticated user
 */
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const rooms = await listUserRooms(session.user.id)
  return NextResponse.json({ rooms })
}

/**
 * POST /api/rooms - Creates a new room
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createRoomSchema.parse(body)

    const room = await createRoom(data.name, session.user.id, data.assistants)

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
