import { RecordId, Table } from 'surrealdb'

import { getDB } from '../lib/db'
import { handleDBError, toStringId } from '../lib/db-errors'
import { query, queryOne } from '../lib/db-helpers'

import type { Assistant, CreateAssistantInput, UpdateAssistantInput } from '@multi-llm/types/db'

export class AssistantRepository {
  private table = new Table('assistant')

  async create(input: CreateAssistantInput): Promise<Assistant> {
    try {
      const db = await getDB()
      const [result] = await db.create<Assistant>(this.table).content(input)
      if (!result) {
        throw new Error('Failed to create assistant')
      }
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async findById(id: string): Promise<Assistant | null> {
    try {
      const db = await getDB()
      const recordId = new RecordId('assistant', id)
      return await queryOne<Assistant>(db, 'SELECT * FROM $id', { id: recordId })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findAll(): Promise<Assistant[]> {
    try {
      const db = await getDB()
      return await query<Assistant>(db, 'SELECT * FROM assistant ORDER BY createdAt DESC')
    } catch (error) {
      handleDBError(error)
    }
  }

  async update(id: string, input: UpdateAssistantInput): Promise<Assistant> {
    try {
      const db = await getDB()
      const recordId = new RecordId('assistant', id)
      const result = await db.update<Assistant>(recordId).merge(input)
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getDB()
      const recordId = new RecordId('assistant', id)
      await db.delete(recordId)
    } catch (error) {
      handleDBError(error)
    }
  }
}

export const assistantRepository = new AssistantRepository()
