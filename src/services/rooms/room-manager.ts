import type { Room, Invite, RoomId, UserId, AssistantId, InviteId } from '@/types'
import { generateId } from '@/lib/utils'

// =============================================================================
// IN-MEMORY STORAGE
// =============================================================================

const rooms = new Map<RoomId, Room>()
const invites = new Map<string, Invite>() // code -> Invite

// =============================================================================
// ROOM FUNCTIONS
// =============================================================================

/**
 * Creates a new room
 */
export function createRoom(
  name: string,
  creatorId: UserId,
  assistantIds: AssistantId[] = []
): Room {
  const room: Room = {
    id: generateId(),
    name,
    createdBy: creatorId,
    createdAt: new Date(),
    participants: [creatorId],
    assistants: assistantIds,
  }

  rooms.set(room.id, room)
  return room
}

/**
 * Gets a room by ID
 */
export function getRoom(roomId: RoomId): Room | undefined {
  return rooms.get(roomId)
}

/**
 * Lists all rooms for a user
 */
export function listUserRooms(userId: UserId): Room[] {
  return Array.from(rooms.values()).filter((room) =>
    room.participants.includes(userId)
  )
}

/**
 * Adds a participant to a room
 */
export function addParticipant(roomId: RoomId, userId: UserId): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  if (!room.participants.includes(userId)) {
    room.participants.push(userId)
  }

  return true
}

/**
 * Removes a participant from a room
 */
export function removeParticipant(roomId: RoomId, userId: UserId): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  room.participants = room.participants.filter((id) => id !== userId)
  return true
}

/**
 * Adds an assistant to a room
 */
export function addAssistant(roomId: RoomId, assistantId: AssistantId): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  if (!room.assistants.includes(assistantId)) {
    room.assistants.push(assistantId)
  }

  return true
}

/**
 * Removes an assistant from a room
 */
export function removeAssistant(roomId: RoomId, assistantId: AssistantId): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  room.assistants = room.assistants.filter((id) => id !== assistantId)
  return true
}

/**
 * Deletes a room
 */
export function deleteRoom(roomId: RoomId): boolean {
  return rooms.delete(roomId)
}

// =============================================================================
// INVITE FUNCTIONS
// =============================================================================

/**
 * Generates a random invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Creates an invite for a room
 */
export function createInvite(
  roomId: RoomId,
  creatorId: UserId,
  expiresInHours?: number,
  maxUses?: number
): Invite | null {
  const room = rooms.get(roomId)
  if (!room) return null

  if (!room.participants.includes(creatorId)) {
    return null
  }

  const code = generateInviteCode()
  const invite: Invite = {
    id: generateId() as InviteId,
    roomId,
    code,
    createdBy: creatorId,
    createdAt: new Date(),
    expiresAt: expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : undefined,
    usesRemaining: maxUses,
  }

  invites.set(code, invite)
  room.activeInvite = invite

  return invite
}

/**
 * Gets an invite by code
 */
export function getInvite(code: string): Invite | undefined {
  return invites.get(code.toUpperCase())
}

/**
 * Uses an invite to join a room
 */
export function useInvite(code: string, userId: UserId): Room | null {
  const invite = invites.get(code.toUpperCase())
  if (!invite) return null

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    invites.delete(code.toUpperCase())
    return null
  }

  if (invite.usesRemaining !== undefined && invite.usesRemaining <= 0) {
    invites.delete(code.toUpperCase())
    return null
  }

  const success = addParticipant(invite.roomId, userId)
  if (!success) return null

  if (invite.usesRemaining !== undefined) {
    invite.usesRemaining--
    if (invite.usesRemaining <= 0) {
      invites.delete(code.toUpperCase())
    }
  }

  return rooms.get(invite.roomId) || null
}

/**
 * Invalidates an invite
 */
export function invalidateInvite(code: string): boolean {
  return invites.delete(code.toUpperCase())
}

// =============================================================================
// EXPORTS FOR TESTS / DEBUG
// =============================================================================

export function getAllRooms(): Room[] {
  return Array.from(rooms.values())
}

export function clearAll(): void {
  rooms.clear()
  invites.clear()
}
