import { getRequestListener } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { createServer } from 'node:http'

import { initializeRedis, shutdownRedis } from './lib/redis-init.js'
import {
  initializeSocketServer,
  shutdownSocketServer,
} from './websocket/server.js'
import { logger } from './lib/logger.js'
import { correlationId } from './lib/correlation-id.js'

const app = new Hono()

// Middleware
app.use('*', honoLogger())
app.use('*', correlationId)
app.use('*', cors())

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes will be added here
app.get('/', (c) => {
  return c.json({ message: 'Multi-LLM Chat API', version: '0.1.0' })
})

// Initialize server
async function startServer() {
  try {
    const port = Number(process.env.PORT) || 4000

    logger.info(`Starting API server on port ${port}...`)

    // 1. Initialize Redis connections and subscribers
    await initializeRedis()

    // 2. Create HTTP server with Hono
    const httpServer = createServer(getRequestListener(app.fetch))

    // 3. Initialize WebSocket server
    initializeSocketServer(httpServer)

    // 4. Start HTTP server
    httpServer.listen(port, () => {
      logger.info(`🚀 API server running on http://localhost:${port}`)
      logger.info(`📡 WebSocket server ready for connections`)
    })

    // 5. Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} signal received: starting graceful shutdown`)

      try {
        // Notify WebSocket clients
        await shutdownSocketServer()

        // Close Redis connections
        await shutdownRedis()

        // Close HTTP server
        httpServer.close(() => {
          logger.info('HTTP server closed')
          process.exit(0)
        })

        // Force exit if graceful shutdown takes too long
        setTimeout(() => {
          logger.error('Graceful shutdown timeout, forcing exit')
          process.exit(1)
        }, 10000)
      } catch (error) {
        logger.error({ error }, 'Error during shutdown')
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (error) {
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}

startServer()
