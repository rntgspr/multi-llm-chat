import { createServer } from 'http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

import { configureWebSocket } from './src/services/websocket/server'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  configureWebSocket(io)

  httpServer.listen(port, () => {
    console.log(`> Server running at http://localhost:${port} [${dev ? 'development' : 'production'}]`)
  })
})
