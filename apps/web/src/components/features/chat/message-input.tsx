'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, Image, Loader2, Paperclip, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface MessageInputProps {
  roomId: string
}

async function sendMessage(roomId: string, content: { type: string; text: string }[]) {
  const response = await fetch(`/api/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error('Failed to send message')
  }
  return response.json()
}

export function MessageInput({ roomId }: MessageInputProps) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      const content = []

      if (text.trim()) {
        content.push({ type: 'text', text: text.trim() })
      }

      // TODO: File upload

      return sendMessage(roomId, content)
    },
    onSuccess: () => {
      setText('')
      setFiles([])
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] })
      textareaRef.current?.focus()
    },
    onError: () => {
      textareaRef.current?.focus()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && files.length === 0) return
    mutation.mutate()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    setFiles((current) => [...current, ...newFiles])
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index))
  }

  const canSubmit = (text.trim().length > 0 || files.length > 0) && !mutation.isPending

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
                {file.type.startsWith('image/') ? (
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="max-w-30 truncate text-xs">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="p-0.5 hover:bg-background rounded">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring transition-shadow"
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={1}
            disabled={mutation.isPending}
            className="w-full resize-none bg-transparent px-4 py-3.5 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-13 max-h-50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              overflowY: text.split('\n').length > 5 ? 'auto' : 'hidden',
            }}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-2">
          Press <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new
          line
        </p>
      </div>
    </div>
  )
}
