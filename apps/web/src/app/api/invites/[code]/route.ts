import { getInvite, useInvite } from '@multi-llm/maintenance'
import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ code: string }>
}

/**
 * GET /api/invites/[code] - Gets invite info (without using it)
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { code } = await params
  const invite = await getInvite(code)

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  if (invite.usesRemaining !== undefined && invite.usesRemaining <= 0) {
    return NextResponse.json({ error: 'Invite exhausted' }, { status: 410 })
  }

  return NextResponse.json({
    valid: true,
    roomId: invite.roomId,
    expiresAt: invite.expiresAt,
    usesRemaining: invite.usesRemaining,
  })
}

/**
 * POST /api/invites/[code] - Uses the invite to join the room
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  const { code } = await params

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const room = await useInvite(code, session.user.id)

  if (!room) {
    return NextResponse.json({ error: 'Invalid, expired, or exhausted invite' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    room,
    message: `You joined room "${room.name}"`,
  })
}
