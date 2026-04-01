import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  criarSala,
  listarSalasUsuario,
} from '@/services/salas/gerenciador-salas'
import * as z from 'zod'

const schemaCriarSala = z.object({
  nome: z.string().min(1).max(100),
  assistentes: z.array(z.string()).optional().default([]),
})

/**
 * GET /api/salas - Lista as salas do usuário autenticado
 */
export async function GET() {
  const sessao = await auth()

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const salas = listarSalasUsuario(sessao.user.id)
  return NextResponse.json({ salas })
}

/**
 * POST /api/salas - Cria uma nova sala
 */
export async function POST(request: NextRequest) {
  const sessao = await auth()

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  try {
    const corpo = await request.json()
    const dados = schemaCriarSala.parse(corpo)

    const sala = criarSala(dados.nome, sessao.user.id, dados.assistentes)

    return NextResponse.json({ sala }, { status: 201 })
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
