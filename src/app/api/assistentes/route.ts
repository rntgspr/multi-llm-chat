import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  listarAssistentes,
  listarAssistentesOnline,
} from '@/services/assistentes/gerenciador-assistentes'

/**
 * GET /api/assistentes - Lista todos os assistentes disponíveis
 */
export async function GET(request: Request) {
  const sessao = await auth()

  if (!sessao?.user?.id) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const apenasOnline = searchParams.get('online') === 'true'

  const assistentes = apenasOnline ? listarAssistentesOnline() : listarAssistentes()

  return NextResponse.json({ assistentes })
}
