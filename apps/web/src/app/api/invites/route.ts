import { createInvite, getRoom } from '@multi-llm/maintenance'
import { type NextRequest, NextResponse } from 'next/server'
import * as z from 'zod'

import { auth } from '@/lib/auth'

const createInviteSchema = z.object({
  roomId: z.string(),
  expiresInHours: z.number().optional(),
  maxUses: z.number().optional(),
})

/**
 * POST /api/invites - Creates an invite for a room
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { roomId, expiresInHours, maxUses } = createInviteSchema.parse(body)

    const room = getRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!room.participants.includes(session.user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const invite = createInvite(roomId, session.user.id, expiresInHours, maxUses)

    if (!invite) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 400 })
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/join/${invite.code}`

    return NextResponse.json({ invite, inviteUrl }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
