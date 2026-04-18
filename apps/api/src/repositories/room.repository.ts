import { RecordId, Table } from 'surrealdb'

import { getDB } from '../lib/db'
import { handleDBError, toStringId } from '../lib/db-errors'
import { query, queryOne } from '../lib/db-helpers'

import type { CreateRoomInput, Room, UpdateRoomInput } from '@synergy/types/db'

export class RoomRepository {
  private table = new Table('room')

  async create(input: CreateRoomInput): Promise<Room> {
    try {
      const db = await getDB()
      const [result] = await db.create<Room>(this.table).content(input)
      if (!result) {
        throw new Error('Failed to create room')
      }
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async findById(id: string): Promise<Room | null> {
    try {
      const db = await getDB()
      const recordId = new RecordId('room', id)
      return await queryOne<Room>(db, 'SELECT * FROM $id', { id: recordId })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findAll(): Promise<Room[]> {
    try {
      const db = await getDB()
      return await query<Room>(db, 'SELECT * FROM room ORDER BY createdAt DESC')
    } catch (error) {
      handleDBError(error)
    }
  }

  async findByMember(userId: string): Promise<Room[]> {
    try {
      const db = await getDB()
      return await query<Room>(db, 'SELECT * FROM room WHERE $userId IN participants ORDER BY createdAt DESC', {
        userId,
      })
    } catch (error) {
      handleDBError(error)
    }
  }

  async update(id: string, input: UpdateRoomInput): Promise<Room> {
    try {
      const db = await getDB()
      const recordId = new RecordId('room', id)
      const result = await db.update<Room>(recordId).merge(input)
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async addMember(roomId: string, userId: string): Promise<Room> {
    try {
      const room = await this.findById(roomId)
      if (!room) {
        throw new Error(`Room ${roomId} not found`)
      }

      if (!room.participants.includes(userId)) {
        const updatedParticipants = [...room.participants, userId]
        return await this.update(roomId, { participants: updatedParticipants })
      }

      return room
    } catch (error) {
      handleDBError(error)
    }
  }

  async removeMember(roomId: string, userId: string): Promise<Room> {
    try {
      const room = await this.findById(roomId)
      if (!room) {
        throw new Error(`Room ${roomId} not found`)
      }

      const updatedParticipants = room.participants.filter((participantId: string) => participantId !== userId)
      return await this.update(roomId, { participants: updatedParticipants })
    } catch (error) {
      handleDBError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getDB()
      const recordId = new RecordId('room', id)
      await db.delete(recordId)
    } catch (error) {
      handleDBError(error)
    }
  }
}

export const roomRepository = new RoomRepository()
