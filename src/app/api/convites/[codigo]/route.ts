import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { obterConvite, usarConvite } from '@/services/salas/gerenciador-salas'

interface RotaParams {
  params: Promise<{ codigo: string }>
}

/**
 * GET /api/convites/[codigo] - Obtém informações do convite (sem usar)
 */
export async function GET(_request: NextRequest, { params }: RotaParams) {
  const { codigo } = await params
  const convite = obterConvite(codigo)

  if (!convite) {
    return NextResponse.json({ erro: 'Convite não encontrado ou expirado' }, { status: 404 })
  }

  // Verificar se expirou
  if (convite.expiraEm && new Date() > convite.expiraEm) {
    return NextResponse.json({ erro: 'Convite expirado' }, { status: 410 })
  }

  // Verificar usos restantes
  if (convite.usosRestantes !== undefined && convite.usosRestantes <= 0) {
    return NextResponse.json({ erro: 'Convite esgotado' }, { status: 410 })
  }

  return NextResponse.json({
    valido: true,
    salaId: convite.salaId,
    expiraEm: convite.expiraEm,
    usosRestantes: convite.usosRestantes,
  })
}

/**
 * POST /api/convites/[codigo] - Usa o convite para entrar na sala
 */
export async function POST(_request: NextRequest, { params }: RotaParams) {
  const sessao = await auth()
  const { codigo } = await params

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const sala = usarConvite(codigo, sessao.user.id)

  if (!sala) {
    return NextResponse.json(
      { erro: 'Convite inválido, expirado ou esgotado' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    sucesso: true,
    sala,
    mensagem: `Você entrou na sala "${sala.nome}"`,
  })
}
