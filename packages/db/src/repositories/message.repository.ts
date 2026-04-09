import { RecordId, Table } from 'surrealdb'

import { getDB } from '../lib/db'
import { handleDBError, toStringId } from '../lib/db-errors'
import { query, queryOne } from '../lib/db-helpers'

import type { CreateMessageInput, Message } from '@multi-llm/types/db'

export class MessageRepository {
  private table = new Table('message')

  async create(input: CreateMessageInput): Promise<Message> {
    try {
      const db = await getDB()
      const [result] = await db.create<Message>(this.table).content(input)
      if (!result) {
        throw new Error('Failed to create message')
      }
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async findById(id: string): Promise<Message | null> {
    try {
      const db = await getDB()
      const recordId = new RecordId('message', id)
      return await queryOne<Message>(db, 'SELECT * FROM $id', { id: recordId })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findAll(): Promise<Message[]> {
    try {
      const db = await getDB()
      return await query<Message>(db, 'SELECT * FROM message ORDER BY timestamp DESC')
    } catch (error) {
      handleDBError(error)
    }
  }

  async findByRoom(roomId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      const db = await getDB()
      return await query<Message>(
        db,
        'SELECT * FROM message WHERE roomId = $roomId ORDER BY timestamp DESC LIMIT $limit START $offset',
        { roomId, limit, offset }
      )
    } catch (error) {
      handleDBError(error)
    }
  }

  async countByRoom(roomId: string): Promise<number> {
    try {
      const db = await getDB()
      const result = await query<{ count: number }>(
        db,
        'SELECT count() AS count FROM message WHERE roomId = $roomId GROUP ALL',
        { roomId }
      )
      return result[0]?.count || 0
    } catch (error) {
      handleDBError(error)
    }
  }

  async update(id: string, input: Partial<Omit<Message, 'id' | 'timestamp'>>): Promise<Message> {
    try {
      const db = await getDB()
      const recordId = new RecordId('message', id)
      const result = await db.update<Message>(recordId).merge(input)
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getDB()
      const recordId = new RecordId('message', id)
      await db.delete(recordId)
    } catch (error) {
      handleDBError(error)
    }
  }
}

export const messageRepository = new MessageRepository()
