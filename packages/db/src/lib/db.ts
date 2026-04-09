/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Surreal } from 'surrealdb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

class SurrealDBClient {
  private static instance: Surreal
  private static connected = false
  private static schemaApplied = false

  private constructor() {}

  static async getInstance(): Promise<Surreal> {
    if (!SurrealDBClient.instance) {
      SurrealDBClient.instance = new Surreal()
    }

    if (!SurrealDBClient.connected) {
      await SurrealDBClient.connect()
    }

    return SurrealDBClient.instance
  }

  private static async connect() {
    const url = process.env.SURREAL_URL || 'ws://localhost:8000/rpc'
    const namespace = process.env.SURREAL_NAMESPACE || 'multi_llm_chat'
    const database = process.env.SURREAL_DATABASE || 'chat'
    const user = process.env.SURREAL_USER || 'root'
    const pass = process.env.SURREAL_PASS || 'root'

    try {
      await SurrealDBClient.instance.connect(url, {
        namespace,
        database,
      })

      await SurrealDBClient.instance.signin({
        username: user,
        password: pass,
      })

      SurrealDBClient.connected = true
      console.log('[SurrealDB] Connected successfully')

      // Apply schema after connection
      await SurrealDBClient.applySchema()
    } catch (error) {
      console.error('[SurrealDB] Connection failed:', error)
      throw error
    }
  }

  private static async applySchema() {
    if (SurrealDBClient.schemaApplied) {
      return
    }

    try {
      const schemaPath = join(__dirname, '..', 'schema.surql')
      const schema = readFileSync(schemaPath, 'utf-8')

      // Execute schema queries
      await SurrealDBClient.instance.query(schema)

      SurrealDBClient.schemaApplied = true
      console.log('[SurrealDB] Schema applied successfully')
    } catch (error) {
      console.error('[SurrealDB] Failed to apply schema:', error)
      // Don't throw - allow the connection to proceed even if schema fails
      // This allows the app to run with existing schema
    }
  }

  static async disconnect() {
    if (SurrealDBClient.instance) {
      await SurrealDBClient.instance.close()
      SurrealDBClient.connected = false
      SurrealDBClient.schemaApplied = false
      console.log('[SurrealDB] Disconnected')
    }
  }

  static isConnected(): boolean {
    return SurrealDBClient.connected
  }
}

// Helper export
export const getDB = () => SurrealDBClient.getInstance()
export const dbClient = SurrealDBClient
