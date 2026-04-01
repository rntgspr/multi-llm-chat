'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface EntrarComConviteProps {
  codigo: string
}

async function verificarConvite(codigo: string) {
  const resposta = await fetch(`/api/convites/${codigo}`)
  if (!resposta.ok) {
    const dados = await resposta.json()
    throw new Error(dados.erro || 'Convite inválido')
  }
  return resposta.json()
}

async function usarConvite(codigo: string) {
  const resposta = await fetch(`/api/convites/${codigo}`, {
    method: 'POST',
  })
  if (!resposta.ok) {
    const dados = await resposta.json()
    throw new Error(dados.erro || 'Falha ao usar convite')
  }
  return resposta.json()
}

export function EntrarComConvite({ codigo }: EntrarComConviteProps) {
  const router = useRouter()

  // Verificar se o convite é válido
  const { data: dadosConvite, isLoading: verificando, error: erroVerificacao } = useQuery({
    queryKey: ['convite', codigo],
    queryFn: () => verificarConvite(codigo),
  })

  // Mutation para usar o convite
  const mutacao = useMutation({
    mutationFn: () => usarConvite(codigo),
    onSuccess: (data) => {
      // Redirecionar para a sala após entrar
      router.push(`/salas/${data.sala.id}`)
    },
  })

  // Auto-usar convite se válido
  useEffect(() => {
    if (dadosConvite?.valido && !mutacao.isPending && !mutacao.isSuccess && !mutacao.isError) {
      mutacao.mutate()
    }
  }, [dadosConvite, mutacao])

  // Estado: Verificando convite
  if (verificando) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Verificando convite...</h1>
      </div>
    )
  }

  // Estado: Convite inválido
  if (erroVerificacao) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Convite inválido</h1>
        <p className="text-muted-foreground">
          {erroVerificacao instanceof Error ? erroVerificacao.message : 'O convite não é válido ou expirou'}
        </p>
        <button
          onClick={() => router.push('/salas')}
          className="mt-4 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Ir para minhas salas
        </button>
      </div>
    )
  }

  // Estado: Entrando na sala
  if (mutacao.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Entrando na sala...</h1>
      </div>
    )
  }

  // Estado: Erro ao entrar
  if (mutacao.isError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Erro ao entrar</h1>
        <p className="text-muted-foreground">
          {mutacao.error instanceof Error ? mutacao.error.message : 'Não foi possível entrar na sala'}
        </p>
        <button
          onClick={() => mutacao.mutate()}
          className="mt-4 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // Estado: Sucesso (breve, antes do redirect)
  if (mutacao.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h1 className="text-xl font-semibold text-foreground">Entrando na sala...</h1>
      </div>
    )
  }

  return null
}
