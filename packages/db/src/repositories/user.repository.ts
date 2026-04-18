import { RecordId, Table } from 'surrealdb'

import { getDB } from '../lib/db'
import { handleDBError, toStringId } from '../lib/db-errors'
import { query, queryOne } from '../lib/db-helpers'

import type { CreateUserInput, UpdateUserInput, User } from '@synergy/types/db'

export class UserRepository {
  private table = new Table('user')

  async create(input: CreateUserInput): Promise<User> {
    try {
      const db = await getDB()
      const [result] = await db.create<User>(this.table).content(input)
      if (!result) {
        throw new Error('Failed to create user')
      }
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const db = await getDB()
      const recordId = new RecordId('user', id)
      return await queryOne<User>(db, 'SELECT * FROM $id', { id: recordId })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const db = await getDB()
      return await queryOne<User>(db, 'SELECT * FROM user WHERE email = $email', { email })
    } catch (error) {
      handleDBError(error)
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const db = await getDB()
      return await query<User>(db, 'SELECT * FROM user ORDER BY createdAt DESC')
    } catch (error) {
      handleDBError(error)
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const db = await getDB()
      const recordId = new RecordId('user', id)
      const result = await db.update<User>(recordId).merge(input)
      return { ...result, id: toStringId(result.id) }
    } catch (error) {
      handleDBError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getDB()
      const recordId = new RecordId('user', id)
      await db.delete(recordId)
    } catch (error) {
      handleDBError(error)
    }
  }
}

export const userRepository = new UserRepository()
