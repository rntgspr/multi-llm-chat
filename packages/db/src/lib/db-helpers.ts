import type { Surreal } from 'surrealdb'

export async function query<T>(db: Surreal, sql: string, params?: Record<string, unknown>): Promise<T[]> {
  const result = await db.query(sql, params)
  return result[0] as T[]
}

export async function queryOne<T>(db: Surreal, sql: string, params?: Record<string, unknown>): Promise<T | null> {
  const results = await query<T>(db, sql, params)
  return results[0] || null
}
