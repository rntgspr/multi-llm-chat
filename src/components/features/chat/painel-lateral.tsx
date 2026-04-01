'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Users, Bot, Link2, Copy, Check, Loader2 } from 'lucide-react'
import type { Sala, Convite } from '@/types'

interface PainelLateralProps {
  sala: Sala
}

async function gerarConvite(salaId: string): Promise<{ convite: Convite; urlConvite: string }> {
  const resposta = await fetch('/api/convites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salaId }),
  })
  if (!resposta.ok) {
    throw new Error('Falha ao gerar convite')
  }
  return resposta.json()
}

export function PainelLateral({ sala }: PainelLateralProps) {
  const [urlConvite, setUrlConvite] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const mutacaoConvite = useMutation({
    mutationFn: () => gerarConvite(sala.id),
    onSuccess: (data) => {
      setUrlConvite(data.urlConvite)
    },
  })

  const copiarLink = async () => {
    if (!urlConvite) return

    try {
      await navigator.clipboard.writeText(urlConvite)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback para navegadores mais antigos
      const input = document.createElement('input')
      input.value = urlConvite
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card">
      {/* Participantes */}
      <div className="p-4 border-b border-border">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Users className="h-4 w-4" />
          Participantes ({sala.participantes.length})
        </h3>
        <ul className="space-y-2">
          {sala.participantes.map((participanteId) => (
            <li
              key={participanteId}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="truncate">{participanteId}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Assistentes */}
      <div className="p-4 border-b border-border">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Bot className="h-4 w-4" />
          Assistentes ({sala.assistentes.length})
        </h3>
        <ul className="space-y-2">
          {sala.assistentes.map((assistenteId) => (
            <li
              key={assistenteId}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Bot className="h-4 w-4 text-primary" />
              <span className="truncate">{assistenteId}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Convidar */}
      <div className="p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Link2 className="h-4 w-4" />
          Convidar
        </h3>

        {!urlConvite ? (
          <button
            onClick={() => mutacaoConvite.mutate()}
            disabled={mutacaoConvite.isPending}
            className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {mutacaoConvite.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              'Gerar Link de Convite'
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <input
                type="text"
                value={urlConvite}
                readOnly
                className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
              />
              <button
                onClick={copiarLink}
                className="p-1.5 rounded hover:bg-background transition-colors"
                title="Copiar link"
              >
                {copiado ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compartilhe este link para convidar pessoas
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
