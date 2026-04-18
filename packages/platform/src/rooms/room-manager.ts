import { inviteRepository, roomRepository } from '@multi-llm/db/repositories'

import type { AssistantId, Invite, Room, RoomId, UserId } from '@multi-llm/types'

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

// =============================================================================
// ROOM FUNCTIONS
// =============================================================================

/**
 * Creates a new room
 */
export async function createRoom(name: string, creatorId: UserId, assistantIds: AssistantId[] = []): Promise<Room> {
  try {
    return await roomRepository.create({
      name,
      createdBy: creatorId,
      participants: [creatorId],
      assistants: assistantIds,
    })
  } catch (error) {
    console.error('[RoomManager] Failed to create room:', error)
    throw new Error('Failed to create room')
  }
}

/**
 * Gets a room by ID
 */
export async function getRoom(roomId: RoomId): Promise<Room | undefined> {
  try {
    const room = await roomRepository.findById(roomId)
    return room ?? undefined
  } catch (error) {
    console.error('[RoomManager] Failed to get room:', error)
    return undefined
  }
}

/**
 * Lists all rooms for a user
 */
export async function listUserRooms(userId: UserId): Promise<Room[]> {
  try {
    return await roomRepository.findByMember(userId)
  } catch (error) {
    console.error('[RoomManager] Failed to list user rooms:', error)
    return []
  }
}

/**
 * Adds a participant to a room
 */
export async function addParticipant(roomId: RoomId, userId: UserId): Promise<boolean> {
  try {
    await roomRepository.addMember(roomId, userId)
    return true
  } catch (error) {
    console.error('[RoomManager] Failed to add participant:', error)
    return false
  }
}

/**
 * Removes a participant from a room
 */
export async function removeParticipant(roomId: RoomId, userId: UserId): Promise<boolean> {
  try {
    await roomRepository.removeMember(roomId, userId)
    return true
  } catch (error) {
    console.error('[RoomManager] Failed to remove participant:', error)
    return false
  }
}

/**
 * Adds an assistant to a room
 */
export async function addAssistant(roomId: RoomId, assistantId: AssistantId): Promise<boolean> {
  try {
    const room = await roomRepository.findById(roomId)
    if (!room) return false

    if (!room.assistants.includes(assistantId)) {
      const updatedAssistants = [...room.assistants, assistantId]
      await roomRepository.update(roomId, { assistants: updatedAssistants })
    }
    return true
  } catch (error) {
    console.error('[RoomManager] Failed to add assistant:', error)
    return false
  }
}

/**
 * Removes an assistant from a room
 */
export async function removeAssistant(roomId: RoomId, assistantId: AssistantId): Promise<boolean> {
  try {
    const room = await roomRepository.findById(roomId)
    if (!room) return false

    const updatedAssistants = room.assistants.filter((id) => id !== assistantId)
    await roomRepository.update(roomId, { assistants: updatedAssistants })
    return true
  } catch (error) {
    console.error('[RoomManager] Failed to remove assistant:', error)
    return false
  }
}

/**
 * Deletes a room
 */
export async function deleteRoom(roomId: RoomId): Promise<boolean> {
  try {
    await roomRepository.delete(roomId)
    return true
  } catch (error) {
    console.error('[RoomManager] Failed to delete room:', error)
    return false
  }
}

/**
 * Lists all rooms
 */
export async function listAllRooms(): Promise<Room[]> {
  try {
    return await roomRepository.findAll()
  } catch (error) {
    console.error('[RoomManager] Failed to list all rooms:', error)
    return []
  }
}

// =============================================================================
// INVITE FUNCTIONS
// =============================================================================

/**
 * Creates an invite for a room
 */
export async function createInvite(
  roomId: RoomId,
  creatorId: UserId,
  expiresInHours?: number,
  maxUses?: number
): Promise<Invite | null> {
  try {
    const room = await roomRepository.findById(roomId)
    if (!room) return null

    if (!room.participants.includes(creatorId)) {
      return null
    }

    const code = generateInviteCode()
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined

    return await inviteRepository.create({
      roomId,
      code,
      createdBy: creatorId,
      expiresAt,
      maxUses,
      usedBy: undefined,
    })
  } catch (error) {
    console.error('[RoomManager] Failed to create invite:', error)
    return null
  }
}

/**
 * Gets an invite by code
 */
export async function getInvite(code: string): Promise<Invite | undefined> {
  try {
    const invite = await inviteRepository.findByCode(code.toUpperCase())
    return invite ?? undefined
  } catch (error) {
    console.error('[RoomManager] Failed to get invite:', error)
    return undefined
  }
}

/**
 * Uses an invite to join a room
 */
export async function useInvite(code: string, userId: UserId): Promise<Room | null> {
  try {
    const invite = await inviteRepository.findByCode(code.toUpperCase())
    if (!invite) return null

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await inviteRepository.delete(invite.id)
      return null
    }

    if (invite.maxUses !== undefined && invite.usedBy !== undefined) {
      return null
    }

    const success = await addParticipant(invite.roomId, userId)
    if (!success) return null

    await inviteRepository.markAsUsed(invite.id, userId)

    return await roomRepository.findById(invite.roomId)
  } catch (error) {
    console.error('[RoomManager] Failed to use invite:', error)
    return null
  }
}

/**
 * Invalidates an invite
 */
export async function invalidateInvite(code: string): Promise<boolean> {
  try {
    const invite = await inviteRepository.findByCode(code.toUpperCase())
    if (!invite) return false

    await inviteRepository.delete(invite.id)
    return true
  } catch (error) {
    console.error('[RoomManager] Failed to invalidate invite:', error)
    return false
  }
}
