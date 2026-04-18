'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  connect,
  disconnect,
  onMessage,
  onTyping,
  joinRoom as wsJoinRoom,
  leaveRoom as wsLeaveRoom,
  sendMessage as wsSendMessage,
  setTyping as wsSetTyping,
} from '@/services/websocket'

import type { Message, RoomId, TypingEvent, UserId } from '@synergy/types'

interface UseWebSocketReturn {
  connected: boolean
  messages: Message[]
  usersTyping: Map<string, boolean>
  joinRoom: (roomId: RoomId) => void
  leaveRoom: (roomId: RoomId) => void
  sendMessage: (message: Message) => void
  setTyping: (roomId: RoomId, isTyping: boolean) => void
}

export function useWebSocket(userId: UserId): UseWebSocketReturn {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [usersTyping, setUsersTyping] = useState<Map<string, boolean>>(new Map())
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Connect is async, so we need to handle it properly
    connect(userId).then((socket) => {
      socket.on('connect', () => {
        setConnected(true)
      })

      socket.on('disconnect', () => {
        setConnected(false)
      })
    })

    const cancelMessage = onMessage((event) => {
      setMessages((current) => [...current, event.message])
    })

    const cancelTyping = onTyping((event: TypingEvent) => {
      setUsersTyping((current) => {
        const next = new Map(current)
        if (event.isTyping) {
          next.set(event.senderId, true)
        } else {
          next.delete(event.senderId)
        }
        return next
      })
    })

    return () => {
      cancelMessage()
      cancelTyping()
      disconnect()
    }
  }, [userId])

  const joinRoom = useCallback(
    (roomId: RoomId) => {
      wsJoinRoom(roomId, userId)
    },
    [userId]
  )

  const leaveRoom = useCallback(
    (roomId: RoomId) => {
      wsLeaveRoom(roomId, userId)
    },
    [userId]
  )

  const sendMessage = useCallback((message: Message) => {
    wsSendMessage(message)
  }, [])

  const setTyping = useCallback(
    (roomId: RoomId, isTyping: boolean) => {
      wsSetTyping(roomId, userId, isTyping)
    },
    [userId]
  )

  return {
    connected,
    messages,
    usersTyping,
    joinRoom,
    leaveRoom,
    sendMessage,
    setTyping,
  }
}
