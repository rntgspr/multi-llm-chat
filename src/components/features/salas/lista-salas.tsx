'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { MessageSquare, Users, Bot, Loader2 } from 'lucide-react'
import type { Sala } from '@/types'

async function buscarSalas(): Promise<{ salas: Sala[] }> {
  const resposta = await fetch('/api/salas')
  if (!resposta.ok) {
    throw new Error('Falha ao carregar salas')
  }
  return resposta.json()
}

export function ListaSalas() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['salas'],
    queryFn: buscarSalas,
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
        <p className="text-destructive">Erro ao carregar salas</p>
      </div>
    )
  }

  const salas = data?.salas || []

  if (salas.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Nenhuma sala ainda
        </h2>
        <p className="text-muted-foreground mb-6">
          Crie sua primeira sala para começar a conversar
        </p>
        <Link
          href="/salas/nova"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Criar Sala
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {salas.map((sala) => (
        <Link
          key={sala.id}
          href={`/salas/${sala.id}`}
          className="group rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors"
        >
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {sala.nome}
          </h3>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {sala.participantes.length}
            </span>
            <span className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              {sala.assistentes.length}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Criada em {new Date(sala.criadoEm).toLocaleDateString('pt-BR')}
          </p>
        </Link>
      ))}
    </div>
  )
}
