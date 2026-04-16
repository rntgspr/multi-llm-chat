import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { initializeRedis, shutdownRedis } from './lib/redis-init.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes will be added here
app.get('/', (c) => {
  return c.json({ message: 'Multi-LLM Chat API', version: '0.1.0' })
})

// Initialize Redis before starting server
async function startServer() {
  try {
    // Initialize Redis connections and subscribers
    await initializeRedis()

    // Start server
    const port = Number(process.env.PORT) || 3001
    console.log(`🚀 API server starting on port ${port}`)

    serve({
      fetch: app.fetch,
      port,
    })

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server')
      await shutdownRedis()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server')
      await shutdownRedis()
      process.exit(0)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
