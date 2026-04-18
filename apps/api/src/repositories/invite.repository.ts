import { RecordId, Table } from 'surrealdb'

import { getDB } from '../lib/db'
import { handleDBError, toStringId } from '../lib/db-errors'
import { query, queryOne } from '../lib/db-helpers'

import type { CreateInviteInput, Invite } from '@synergy/types/db'

export class InviteRepository {
  private table = new Table('invite')

  async create(input: CreateInviteInput): Promise<Invite> {
    try {
      const db = await getDB()
      const [result] = await db.create<Invite>(this.table).content(input)
      if (!result) {
        throw new Error('Failed to create invite')
      }
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async findById(id: string): Promise<Invite | null> {
    try {
      const db = await getDB()
      const recordId = new RecordId('invite', id)
      return await queryOne<Invite>(db, 'SELECT * FROM $id', { id: recordId })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findByCode(code: string): Promise<Invite | null> {
    try {
      const db = await getDB()
      return await queryOne<Invite>(db, 'SELECT * FROM invite WHERE code = $code', { code })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findAll(): Promise<Invite[]> {
    try {
      const db = await getDB()
      return await query<Invite>(db, 'SELECT * FROM invite ORDER BY createdAt DESC')
    } catch (error) {
      handleDBError(error)
    }
  }

  async markAsUsed(id: string, userId: string): Promise<Invite> {
    try {
      const db = await getDB()
      const recordId = new RecordId('invite', id)
      const result = await db.update<Invite>(recordId).merge({ usedBy: userId })
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async update(id: string, input: Partial<Omit<Invite, 'id' | 'createdAt'>>): Promise<Invite> {
    try {
      const db = await getDB()
      const recordId = new RecordId('invite', id)
      const result = await db.update<Invite>(recordId).merge(input)
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getDB()
      const recordId = new RecordId('invite', id)
      await db.delete(recordId)
    } catch (error) {
      handleDBError(error)
    }
  }
}

export const inviteRepository = new InviteRepository()
