'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Loader2, MessageSquare, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import type { Room } from '@synergy/types'

async function fetchRooms(): Promise<{ rooms: Room[] }> {
  const response = await fetch('/api/rooms')
  if (!response.ok) {
    throw new Error('Failed to load rooms')
  }
  return response.json()
}

async function deleteRoomApi(roomId: string): Promise<void> {
  const response = await fetch(`/api/rooms/${roomId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete room')
  }
}

export function RoomList() {
  const queryClient = useQueryClient()
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setDeletingRoomId(null)
    },
    onError: (error: Error) => {
      alert(error.message)
      setDeletingRoomId(null)
    },
  })

  const handleDeleteClick = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      setDeletingRoomId(roomId)
      deleteMutation.mutate(roomId)
    }
  }

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
        <div key={room.id} className="relative">
          <Link
            href={`/rooms/${room.id}`}
            className="group block rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors pr-8">
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

            <p className="mt-2 text-xs text-muted-foreground">
              Created {new Date(room.createdAt).toLocaleDateString()}
            </p>
          </Link>

          <button
            type="button"
            onClick={(e) => handleDeleteClick(e, room.id)}
            disabled={deletingRoomId === room.id}
            className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete room"
          >
            {deletingRoomId === room.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      ))}
    </div>
  )
}
