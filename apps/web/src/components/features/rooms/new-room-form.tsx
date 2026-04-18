'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Bot, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { Assistant, Room } from '@synergy/types'

async function fetchAssistants(): Promise<{ assistants: Assistant[] }> {
  const response = await fetch('/api/assistants')
  if (!response.ok) {
    throw new Error('Failed to load assistants')
  }
  return response.json()
}

async function createRoom(data: { name: string; assistants: string[] }): Promise<{ room: Room }> {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create room')
  }
  return response.json()
}

export function NewRoomForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])

  const { data: assistantsData, isLoading: loadingAssistants } = useQuery({
    queryKey: ['assistants'],
    queryFn: fetchAssistants,
  })

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (data) => {
      router.push(`/rooms/${data.room.id}`)
    },
  })

  const toggleAssistant = (id: string) => {
    setSelectedAssistants((current) => (current.includes(id) ? current.filter((a) => a !== id) : [...current, id]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    mutation.mutate({
      name: name.trim(),
      assistants: selectedAssistants,
    })
  }

  const assistants = assistantsData?.assistants || []

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Room Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="E.g., Brainstorm Ideas"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">Select Assistants</label>

        {loadingAssistants ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {assistants.map((assistant) => {
              const selected = selectedAssistants.includes(assistant.id)
              const available = assistant.status === 'online'

              return (
                <button
                  key={assistant.id}
                  type="button"
                  onClick={() => available && toggleAssistant(assistant.id)}
                  disabled={!available}
                  className={`relative flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : available
                        ? 'border-border hover:border-primary/50'
                        : 'border-border opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <Bot className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{assistant.name}</span>
                      <span className={`h-2 w-2 rounded-full ${available ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{assistant.description}</p>
                  </div>

                  {selected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {selectedAssistants.length === 0 && (
          <p className="text-sm text-muted-foreground">Select at least one assistant for the room</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-input px-6 py-3 text-foreground font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!name.trim() || selectedAssistants.length === 0 || mutation.isPending}
          className="flex-1 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Create Room'}
        </button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive text-center">Error creating room. Please try again.</p>
      )}
    </form>
  )
}
