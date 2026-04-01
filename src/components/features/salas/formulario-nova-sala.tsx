'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Bot, Check } from 'lucide-react'
import type { Assistente, Sala } from '@/types'

async function buscarAssistentes(): Promise<{ assistentes: Assistente[] }> {
  const resposta = await fetch('/api/assistentes')
  if (!resposta.ok) {
    throw new Error('Falha ao carregar assistentes')
  }
  return resposta.json()
}

async function criarSala(dados: {
  nome: string
  assistentes: string[]
}): Promise<{ sala: Sala }> {
  const resposta = await fetch('/api/salas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
  if (!resposta.ok) {
    throw new Error('Falha ao criar sala')
  }
  return resposta.json()
}

export function FormularioNovaSala() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [assistentesSelecionados, setAssistentesSelecionados] = useState<string[]>([])

  const { data: dadosAssistentes, isLoading: carregandoAssistentes } = useQuery({
    queryKey: ['assistentes'],
    queryFn: buscarAssistentes,
  })

  const mutacao = useMutation({
    mutationFn: criarSala,
    onSuccess: (data) => {
      router.push(`/salas/${data.sala.id}`)
    },
  })

  const toggleAssistente = (id: string) => {
    setAssistentesSelecionados((atual) =>
      atual.includes(id) ? atual.filter((a) => a !== id) : [...atual, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    mutacao.mutate({
      nome: nome.trim(),
      assistentes: assistentesSelecionados,
    })
  }

  const assistentes = dadosAssistentes?.assistentes || []

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Nome da sala */}
      <div className="space-y-2">
        <label htmlFor="nome" className="block text-sm font-medium text-foreground">
          Nome da Sala
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Brainstorm de Ideias"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Seleção de assistentes */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Selecione os Assistentes
        </label>

        {carregandoAssistentes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {assistentes.map((assistente) => {
              const selecionado = assistentesSelecionados.includes(assistente.id)
              const disponivel = assistente.status === 'online'

              return (
                <button
                  key={assistente.id}
                  type="button"
                  onClick={() => disponivel && toggleAssistente(assistente.id)}
                  disabled={!disponivel}
                  className={`relative flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    selecionado
                      ? 'border-primary bg-primary/10'
                      : disponivel
                        ? 'border-border hover:border-primary/50'
                        : 'border-border opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <Bot
                      className={`h-5 w-5 ${selecionado ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{assistente.nome}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          disponivel ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {assistente.descricao}
                    </p>
                  </div>

                  {selecionado && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {assistentesSelecionados.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Selecione pelo menos um assistente para a sala
          </p>
        )}
      </div>

      {/* Botões */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-input px-6 py-3 text-foreground font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={!nome.trim() || assistentesSelecionados.length === 0 || mutacao.isPending}
          className="flex-1 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutacao.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            'Criar Sala'
          )}
        </button>
      </div>

      {mutacao.isError && (
        <p className="text-sm text-destructive text-center">
          Erro ao criar sala. Tente novamente.
        </p>
      )}
    </form>
  )
}
