import { createRoom, listUserRooms } from '@multi-llm/platform'
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
  // TODO: Re-enable auth after EPIC-002 migration
  // const session = await auth()
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  // }

  // const rooms = await listUserRooms(session.user.id)
  // Temporarily list all rooms for development
  const rooms = await listUserRooms('dev-user')
  return NextResponse.json({ rooms })
}

/**
 * POST /api/rooms - Creates a new room
 */
export async function POST(request: NextRequest) {
  // TODO: Re-enable auth after EPIC-002 migration
  // const session = await auth()
  // if (!session?.user?.id) {
  //   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  // }

  try {
    const body = await request.json()
    const data = createRoomSchema.parse(body)

    // Use dev-user temporarily
    const room = await createRoom(data.name, 'dev-user', data.assistants)

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
