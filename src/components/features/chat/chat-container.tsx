'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ListaMensagens } from './lista-mensagens'
import { InputMensagem } from './input-mensagem'
import { PainelLateral } from './painel-lateral'
import { useWebSocket } from '@/hooks/use-websocket'
import type { Sala } from '@/types'

interface Usuario {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface ChatContainerProps {
  salaId: string
  usuario: Usuario
}

async function buscarSala(salaId: string): Promise<{ sala: Sala }> {
  const resposta = await fetch(`/api/salas/${salaId}`)
  if (!resposta.ok) {
    throw new Error('Sala não encontrada')
  }
  return resposta.json()
}

export function ChatContainer({ salaId, usuario }: ChatContainerProps) {
  const { conectado, entrarSala, sairSala } = useWebSocket(usuario.id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['sala', salaId],
    queryFn: () => buscarSala(salaId),
  })

  useEffect(() => {
    if (conectado) {
      entrarSala(salaId)
    }

    return () => {
      if (conectado) {
        sairSala(salaId)
      }
    }
  }, [conectado, salaId, entrarSala, sairSala])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data?.sala) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive">Sala não encontrada ou acesso negado</p>
        <Link
          href="/salas"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para salas
        </Link>
      </div>
    )
  }

  const sala = data.sala

  return (
    <div className="flex h-screen bg-background">
      {/* Área principal do chat */}
      <div className="flex flex-1 flex-col">
        {/* Cabeçalho */}
        <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
          <Link
            href="/salas"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">{sala.nome}</h1>
            <p className="text-xs text-muted-foreground">
              {sala.participantes.length} participante{sala.participantes.length !== 1 ? 's' : ''} •{' '}
              {sala.assistentes.length} assistente{sala.assistentes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${conectado ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
            <span className="text-xs text-muted-foreground">
              {conectado ? 'Conectado' : 'Conectando...'}
            </span>
          </div>
        </header>

        {/* Lista de mensagens */}
        <ListaMensagens salaId={salaId} usuarioId={usuario.id} />

        {/* Input de mensagem */}
        <InputMensagem salaId={salaId} />
      </div>

      {/* Painel lateral */}
      <PainelLateral sala={sala} />
    </div>
  )
}
