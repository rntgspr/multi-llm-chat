'use client'

import { useMutation } from '@tanstack/react-query'
import { Bot, Check, Copy, Link2, Loader2, Users } from 'lucide-react'
import { useState } from 'react'

import type { Invite, Room } from '@multi-llm/types'

interface SidePanelProps {
  room: Room
}

async function generateInvite(roomId: string): Promise<{ invite: Invite; inviteUrl: string }> {
  const response = await fetch('/api/invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId }),
  })
  if (!response.ok) {
    throw new Error('Failed to generate invite')
  }
  return response.json()
}

export function SidePanel({ room }: SidePanelProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteMutation = useMutation({
    mutationFn: () => generateInvite(room.id),
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl)
    },
  })

  const copyLink = async () => {
    if (!inviteUrl) return

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Users className="h-4 w-4" />
          Participants ({room.participants.length})
        </h3>
        <ul className="space-y-2">
          {room.participants.map((participantId) => (
            <li key={participantId} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="truncate">{participantId}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-b border-border">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Bot className="h-4 w-4" />
          Assistants ({room.assistants.length})
        </h3>
        <ul className="space-y-2">
          {room.assistants.map((assistantId) => (
            <li key={assistantId} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bot className="h-4 w-4 text-primary" />
              <span className="truncate">{assistantId}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Link2 className="h-4 w-4" />
          Invite
        </h3>

        {!inviteUrl ? (
          <button
            onClick={() => inviteMutation.mutate()}
            disabled={inviteMutation.isPending}
            className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Generate Invite Link'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
              />
              <button
                onClick={copyLink}
                className="p-1.5 rounded hover:bg-background transition-colors"
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Share this link to invite people</p>
          </div>
        )}
      </div>
    </aside>
  )
}
