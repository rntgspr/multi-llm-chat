import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  obterSala,
  deletarSala,
  adicionarAssistente,
  removerAssistente,
} from '@/services/salas/gerenciador-salas'
import * as z from 'zod'

interface RotaParams {
  params: Promise<{ salaId: string }>
}

/**
 * GET /api/salas/[salaId] - Obtém detalhes de uma sala
 */
export async function GET(_request: NextRequest, { params }: RotaParams) {
  const sessao = await auth()
  const { salaId } = await params

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const sala = obterSala(salaId)

  if (!sala) {
    return NextResponse.json({ erro: 'Sala não encontrada' }, { status: 404 })
  }

  // Verificar se o usuário é participante
  if (!sala.participantes.includes(sessao.user.id)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  return NextResponse.json({ sala })
}

/**
 * DELETE /api/salas/[salaId] - Deleta uma sala (apenas o criador)
 */
export async function DELETE(_request: NextRequest, { params }: RotaParams) {
  const sessao = await auth()
  const { salaId } = await params

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const sala = obterSala(salaId)

  if (!sala) {
    return NextResponse.json({ erro: 'Sala não encontrada' }, { status: 404 })
  }

  // Apenas o criador pode deletar
  if (sala.criadoPor !== sessao.user.id) {
    return NextResponse.json({ erro: 'Apenas o criador pode deletar a sala' }, { status: 403 })
  }

  deletarSala(salaId)
  return NextResponse.json({ sucesso: true })
}

const schemaAtualizarAssistentes = z.object({
  acao: z.enum(['adicionar', 'remover']),
  assistenteId: z.string(),
})

/**
 * PATCH /api/salas/[salaId] - Atualiza assistentes da sala
 */
export async function PATCH(request: NextRequest, { params }: RotaParams) {
  const sessao = await auth()
  const { salaId } = await params

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const sala = obterSala(salaId)

  if (!sala) {
    return NextResponse.json({ erro: 'Sala não encontrada' }, { status: 404 })
  }

  // Verificar se o usuário é participante
  if (!sala.participantes.includes(sessao.user.id)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  try {
    const corpo = await request.json()
    const { acao, assistenteId } = schemaAtualizarAssistentes.parse(corpo)

    const sucesso =
      acao === 'adicionar'
        ? adicionarAssistente(salaId, assistenteId)
        : removerAssistente(salaId, assistenteId)

    if (!sucesso) {
      return NextResponse.json({ erro: 'Falha ao atualizar assistentes' }, { status: 400 })
    }

    const salaAtualizada = obterSala(salaId)
    return NextResponse.json({ sala: salaAtualizada })
  } catch (erro) {
    if (erro instanceof z.ZodError) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: erro.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
