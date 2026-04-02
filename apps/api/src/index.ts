import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

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

// Start server
const port = Number(process.env.PORT) || 3001

console.log(`🚀 API server starting on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
