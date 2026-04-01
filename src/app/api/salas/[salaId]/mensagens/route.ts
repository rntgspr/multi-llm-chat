import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { obterSala } from '@/services/salas/gerenciador-salas'
import {
  criarMensagem,
  obterMensagensSala,
  criarConteudoTexto,
  criarConteudoImagem,
  criarConteudoArquivo,
} from '@/services/mensagens/gerenciador-mensagens'
import type { ConteudoMensagem } from '@/types'
import * as z from 'zod'

interface RotaParams {
  params: Promise<{ salaId: string }>
}

const schemaConteudo = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('texto'),
    texto: z.string().min(1),
  }),
  z.object({
    tipo: z.literal('imagem'),
    url: z.string().url(),
    altText: z.string().optional(),
    largura: z.number().optional(),
    altura: z.number().optional(),
  }),
  z.object({
    tipo: z.literal('arquivo'),
    url: z.string().url(),
    nomeArquivo: z.string(),
    tamanhoBytes: z.number(),
    mimeType: z.string(),
  }),
])

const schemaEnviarMensagem = z.object({
  conteudo: z.array(schemaConteudo).min(1),
})

/**
 * GET /api/salas/[salaId]/mensagens - Lista mensagens de uma sala
 */
export async function GET(request: NextRequest, { params }: RotaParams) {
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

  const { searchParams } = new URL(request.url)
  const limite = parseInt(searchParams.get('limite') || '50', 10)
  const aPartirDe = searchParams.get('aPartirDe')

  const mensagens = obterMensagensSala(salaId, {
    limite,
    aPartirDe: aPartirDe ? new Date(aPartirDe) : undefined,
    apenasPublicas: true, // Usuários só veem mensagens públicas
  })

  return NextResponse.json({ mensagens })
}

/**
 * POST /api/salas/[salaId]/mensagens - Envia uma mensagem
 */
export async function POST(request: NextRequest, { params }: RotaParams) {
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
    const { conteudo } = schemaEnviarMensagem.parse(corpo)

    // Converter para o formato interno
    const conteudoFormatado: ConteudoMensagem[] = conteudo.map((c) => {
      switch (c.tipo) {
        case 'texto':
          return criarConteudoTexto(c.texto)
        case 'imagem':
          return criarConteudoImagem(c.url, c.altText, c.largura, c.altura)
        case 'arquivo':
          return criarConteudoArquivo(c.url, c.nomeArquivo, c.tamanhoBytes, c.mimeType)
      }
    })

    const mensagem = criarMensagem({
      salaId,
      remetenteId: sessao.user.id,
      tipoRemetente: 'usuario',
      conteudo: conteudoFormatado,
      visibilidade: 'publica',
    })

    // TODO: Emitir via WebSocket para outros participantes
    // TODO: Enviar para o orquestrador processar

    return NextResponse.json({ mensagem }, { status: 201 })
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
