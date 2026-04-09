import { Surreal } from 'surrealdb'

class SurrealDBClient {
  private static instance: Surreal
  private static connected = false

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
    } catch (error) {
      console.error('[SurrealDB] Connection failed:', error)
      throw error
    }
  }

  static async disconnect() {
    if (SurrealDBClient.instance) {
      await SurrealDBClient.instance.close()
      SurrealDBClient.connected = false
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
