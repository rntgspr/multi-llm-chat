'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Paperclip, Image, X, Loader2 } from 'lucide-react'

interface InputMensagemProps {
  salaId: string
}

async function enviarMensagem(salaId: string, conteudo: { tipo: string; texto: string }[]) {
  const resposta = await fetch(`/api/salas/${salaId}/mensagens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conteudo }),
  })
  if (!resposta.ok) {
    throw new Error('Falha ao enviar mensagem')
  }
  return resposta.json()
}

export function InputMensagem({ salaId }: InputMensagemProps) {
  const [texto, setTexto] = useState('')
  const [arquivos, setArquivos] = useState<File[]>([])
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const mutacao = useMutation({
    mutationFn: () => {
      const conteudo = []

      if (texto.trim()) {
        conteudo.push({ tipo: 'texto', texto: texto.trim() })
      }

      // TODO: Upload de arquivos e adicionar ao conteudo

      return enviarMensagem(salaId, conteudo)
    },
    onSuccess: () => {
      setTexto('')
      setArquivos([])
      queryClient.invalidateQueries({ queryKey: ['mensagens', salaId] })
      textareaRef.current?.focus()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!texto.trim() && arquivos.length === 0) return
    mutacao.mutate()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novosArquivos = Array.from(e.target.files || [])
    setArquivos((atual) => [...atual, ...novosArquivos])
    e.target.value = ''
  }

  const removerArquivo = (index: number) => {
    setArquivos((atual) => atual.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-border bg-card p-4">
      {/* Preview de arquivos */}
      {arquivos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {arquivos.map((arquivo, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm"
            >
              {arquivo.type.startsWith('image/') ? (
                <Image className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="max-w-[150px] truncate">{arquivo.name}</span>
              <button
                type="button"
                onClick={() => removerArquivo(index)}
                className="p-0.5 hover:bg-background rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Botão de anexo */}
        <input
          ref={inputArquivoRef}
          type="file"
          multiple
          onChange={handleArquivoChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <button
          type="button"
          onClick={() => inputArquivoRef.current?.click()}
          className="p-2.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Anexar arquivo"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Campo de texto */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[48px] max-h-[200px]"
            style={{
              height: 'auto',
              overflowY: texto.split('\n').length > 5 ? 'auto' : 'hidden',
            }}
          />
        </div>

        {/* Botão enviar */}
        <button
          type="submit"
          disabled={(!texto.trim() && arquivos.length === 0) || mutacao.isPending}
          className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutacao.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  )
}
