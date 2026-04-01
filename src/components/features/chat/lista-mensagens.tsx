'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bot, User, Loader2 } from 'lucide-react'
import type { Mensagem } from '@/types'
import { useWebSocket } from '@/hooks/use-websocket'

interface ListaMensagensProps {
  salaId: string
  usuarioId: string
}

async function buscarMensagens(salaId: string): Promise<{ mensagens: Mensagem[] }> {
  const resposta = await fetch(`/api/salas/${salaId}/mensagens?limite=100`)
  if (!resposta.ok) {
    throw new Error('Falha ao carregar mensagens')
  }
  return resposta.json()
}

export function ListaMensagens({ salaId, usuarioId }: ListaMensagensProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { mensagens: mensagensTempoReal } = useWebSocket(usuarioId)

  const { data, isLoading } = useQuery({
    queryKey: ['mensagens', salaId],
    queryFn: () => buscarMensagens(salaId),
    refetchInterval: 5000, // Poll a cada 5s como fallback
  })

  // Combinar mensagens da API com mensagens em tempo real
  const mensagensApi = data?.mensagens || []
  const todasMensagens = [...mensagensApi, ...mensagensTempoReal.filter(
    (m) => m.salaId === salaId && !mensagensApi.some((api) => api.id === m.id)
  )]

  // Auto-scroll para o final
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [todasMensagens.length])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (todasMensagens.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <Bot className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium text-foreground">Inicie a conversa</h2>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Envie uma mensagem e os assistentes da sala irão responder
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {todasMensagens.map((mensagem) => (
        <MensagemItem
          key={mensagem.id}
          mensagem={mensagem}
          isUsuarioAtual={mensagem.remetenteId === usuarioId}
        />
      ))}
    </div>
  )
}

interface MensagemItemProps {
  mensagem: Mensagem
  isUsuarioAtual: boolean
}

function MensagemItem({ mensagem, isUsuarioAtual }: MensagemItemProps) {
  const isAssistente = mensagem.tipoRemetente === 'assistente'

  return (
    <div
      className={`flex gap-3 ${isUsuarioAtual ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isAssistente
            ? 'bg-primary/20 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isAssistente ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      {/* Conteúdo */}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isUsuarioAtual
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {/* Nome do remetente */}
        {!isUsuarioAtual && (
          <p className="text-xs font-medium mb-1 opacity-70">
            {isAssistente ? mensagem.remetenteId : 'Participante'}
          </p>
        )}

        {/* Conteúdo da mensagem */}
        {mensagem.conteudo.map((conteudo, index) => (
          <div key={index}>
            {conteudo.tipo === 'texto' && (
              <p className="whitespace-pre-wrap break-words">{conteudo.texto}</p>
            )}
            {conteudo.tipo === 'imagem' && (
              <img
                src={conteudo.url}
                alt={conteudo.altText || 'Imagem'}
                className="rounded-lg max-w-full mt-2"
              />
            )}
            {conteudo.tipo === 'arquivo' && (
              <a
                href={conteudo.url}
                className="flex items-center gap-2 mt-2 text-sm underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                📎 {conteudo.nomeArquivo}
              </a>
            )}
          </div>
        ))}

        {/* Timestamp */}
        <p className="text-[10px] mt-1 opacity-50">
          {new Date(mensagem.criadoEm).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
