'use client'

import { useQuery } from '@tanstack/react-query'
import { Bot, Loader2, Sparkles, User } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { useWebSocket } from '@/hooks/use-websocket'

import type { Message } from '@multi-llm/types'

interface MessageListProps {
  roomId: string
  userId: string
}

async function fetchMessages(roomId: string): Promise<{ messages: Message[] }> {
  const response = await fetch(`/api/rooms/${roomId}/messages?limit=100`)
  if (!response.ok) {
    throw new Error('Failed to load messages')
  }
  return response.json()
}

export function MessageList({ roomId, userId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { messages: realtimeMessages } = useWebSocket(userId)

  const { data, isLoading } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => fetchMessages(roomId),
    refetchInterval: 5000,
  })

  const apiMessages = data?.messages || []
  const allMessages = [
    ...apiMessages,
    ...realtimeMessages.filter((m) => m.roomId === roomId && !apiMessages.some((api) => api.id === m.id)),
  ]

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [allMessages.length])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">How can I help you?</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Send a message to start chatting with the assistants in this room
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="py-4">
        {allMessages.map((message) => (
          <MessageItem key={message.id} message={message} isCurrentUser={message.senderId === userId} />
        ))}
        <div className="h-2" />
      </div>
    </div>
  )
}

interface MessageItemProps {
  message: Message
  isCurrentUser: boolean
}

function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const isAssistant = message.senderType === 'assistant'

  if (isCurrentUser) {
    return (
      <div className="px-4 py-1">
        <div className="max-w-3xl mx-auto flex justify-end">
          <div className="max-w-[80%] rounded-3xl bg-muted px-4 py-2.5 text-foreground">
            {message.content.map((content, index) => (
              <div key={index}>
                {content.type === 'text' && (
                  <p className="whitespace-pre-wrap wrap-break-word text-sm">{content.text}</p>
                )}
                {content.type === 'image' && (
                  <img src={content.url} alt={content.altText || 'Image'} className="rounded-xl max-w-full mt-2" />
                )}
                {content.type === 'file' && (
                  <a
                    href={content.url}
                    className="flex items-center gap-2 mt-2 text-sm text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📎 {content.fileName}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="max-w-3xl mx-auto flex gap-3">
        <div
          className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5 ${
            isAssistant ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-1">{isAssistant ? message.senderId : 'Participant'}</p>
          {message.content.map((content, index) => (
            <div key={index}>
              {content.type === 'text' && (
                <p className="whitespace-pre-wrap wrap-break-word text-sm text-foreground leading-relaxed">
                  {content.text}
                </p>
              )}
              {content.type === 'image' && (
                <img src={content.url} alt={content.altText || 'Image'} className="rounded-xl max-w-md mt-2" />
              )}
              {content.type === 'file' && (
                <a
                  href={content.url}
                  className="flex items-center gap-2 mt-2 text-sm text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {content.fileName}
                </a>
              )}
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-2">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
