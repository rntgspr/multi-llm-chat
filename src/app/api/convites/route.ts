import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { criarConvite, obterSala } from '@/services/salas/gerenciador-salas'
import * as z from 'zod'

const schemaCriarConvite = z.object({
  salaId: z.string(),
  expiraEmHoras: z.number().optional(),
  usosMaximos: z.number().optional(),
})

/**
 * POST /api/convites - Cria um convite para uma sala
 */
export async function POST(request: NextRequest) {
  const sessao = await auth()

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  try {
    const corpo = await request.json()
    const { salaId, expiraEmHoras, usosMaximos } = schemaCriarConvite.parse(corpo)

    // Verificar se a sala existe e o usuário é participante
    const sala = obterSala(salaId)
    if (!sala) {
      return NextResponse.json({ erro: 'Sala não encontrada' }, { status: 404 })
    }

    if (!sala.participantes.includes(sessao.user.id)) {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }

    const convite = criarConvite(salaId, sessao.user.id, expiraEmHoras, usosMaximos)

    if (!convite) {
      return NextResponse.json({ erro: 'Falha ao criar convite' }, { status: 400 })
    }

    // Gerar URL completa do convite
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const urlConvite = `${baseUrl}/entrar/${convite.codigo}`

    return NextResponse.json({ convite, urlConvite }, { status: 201 })
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
