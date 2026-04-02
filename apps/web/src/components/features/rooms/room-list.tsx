'use client'

import { useQuery } from '@tanstack/react-query'
import { Bot, Loader2, MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'

import type { Room } from '@multi-llm/types'

async function fetchRooms(): Promise<{ rooms: Room[] }> {
  const response = await fetch('/api/rooms')
  if (!response.ok) {
    throw new Error('Failed to load rooms')
  }
  return response.json()
}

export function RoomList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading rooms</p>
      </div>
    )
  }

  const rooms = data?.rooms || []

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No rooms yet</h2>
        <p className="text-muted-foreground mb-6">Create your first room to start chatting</p>
        <Link
          href="/rooms/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Create Room
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <Link
          key={room.id}
          href={`/rooms/${room.id}`}
          className="group rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {room.name}
          </h3>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {room.participants.length}
            </span>
            <span className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              {room.assistants.length}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">Created {new Date(room.createdAt).toLocaleDateString()}</p>
        </Link>
      ))}
    </div>
  )
}
