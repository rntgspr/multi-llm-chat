'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { SidePanel } from './side-panel'
import { useWebSocket } from '@/hooks/use-websocket'
import type { Room } from '@/types'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface ChatContainerProps {
  roomId: string
  user: User
}

async function fetchRoom(roomId: string): Promise<{ room: Room }> {
  const response = await fetch(`/api/rooms/${roomId}`)
  if (!response.ok) {
    throw new Error('Room not found')
  }
  return response.json()
}

export function ChatContainer({ roomId, user }: ChatContainerProps) {
  const { connected, joinRoom, leaveRoom } = useWebSocket(user.id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => fetchRoom(roomId),
  })

  useEffect(() => {
    if (connected) {
      joinRoom(roomId)
    }

    return () => {
      if (connected) {
        leaveRoom(roomId)
      }
    }
  }, [connected, roomId, joinRoom, leaveRoom])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data?.room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive">Room not found or access denied</p>
        <Link
          href="/rooms"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to rooms
        </Link>
      </div>
    )
  }

  const room = data.room

  return (
    <div className="flex h-screen bg-background">
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Link
            href="/rooms"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{room.name}</h1>
            <p className="text-xs text-muted-foreground">
              {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''} ·{' '}
              {room.assistants.length} assistant{room.assistants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-primary' : 'bg-yellow-500'}`}
            />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </header>

        <MessageList roomId={roomId} userId={user.id} />
        <MessageInput roomId={roomId} />
      </div>

      <SidePanel room={room} />
    </div>
  )
}
