import type {
  Mensagem,
  MensagemId,
  SalaId,
  UsuarioId,
  AssistenteId,
  TipoRemetente,
  VisibilidadeMensagem,
  ConteudoMensagem,
} from '@/types'
import { gerarId } from '@/lib/utils'

// =============================================================================
// ARMAZENAMENTO EM MEMÓRIA
// =============================================================================

// Mensagens por sala: salaId -> Mensagem[]
const mensagensPorSala = new Map<SalaId, Mensagem[]>()

// =============================================================================
// FUNÇÕES
// =============================================================================

interface CriarMensagemParams {
  salaId: SalaId
  remetenteId: UsuarioId | AssistenteId
  tipoRemetente: TipoRemetente
  conteudo: ConteudoMensagem[]
  visibilidade?: VisibilidadeMensagem
  destinatarioId?: AssistenteId
}

/**
 * Cria uma nova mensagem
 */
export function criarMensagem({
  salaId,
  remetenteId,
  tipoRemetente,
  conteudo,
  visibilidade = 'publica',
  destinatarioId,
}: CriarMensagemParams): Mensagem {
  const mensagem: Mensagem = {
    id: gerarId() as MensagemId,
    salaId,
    remetenteId,
    tipoRemetente,
    conteudo,
    visibilidade,
    destinatarioId,
    criadoEm: new Date(),
  }

  if (!mensagensPorSala.has(salaId)) {
    mensagensPorSala.set(salaId, [])
  }

  mensagensPorSala.get(salaId)?.push(mensagem)

  return mensagem
}

/**
 * Obtém todas as mensagens de uma sala
 */
export function obterMensagensSala(
  salaId: SalaId,
  opcoes?: {
    limite?: number
    aPartirDe?: Date
    apenasPublicas?: boolean
  }
): Mensagem[] {
  let mensagens = mensagensPorSala.get(salaId) || []

  // Filtrar apenas públicas se solicitado
  if (opcoes?.apenasPublicas) {
    mensagens = mensagens.filter((m) => m.visibilidade === 'publica')
  }

  // Filtrar a partir de uma data
  if (opcoes?.aPartirDe) {
    mensagens = mensagens.filter((m) => m.criadoEm >= opcoes.aPartirDe!)
  }

  // Aplicar limite (últimas N mensagens)
  if (opcoes?.limite && mensagens.length > opcoes.limite) {
    mensagens = mensagens.slice(-opcoes.limite)
  }

  return mensagens
}

/**
 * Obtém mensagens ocultas destinadas a um assistente específico
 */
export function obterMensagensOcultasParaAssistente(
  salaId: SalaId,
  assistenteId: AssistenteId
): Mensagem[] {
  const mensagens = mensagensPorSala.get(salaId) || []

  return mensagens.filter(
    (m) =>
      m.visibilidade === 'oculta' &&
      (m.destinatarioId === assistenteId || m.destinatarioId === undefined)
  )
}

/**
 * Obtém uma mensagem específica pelo ID
 */
export function obterMensagem(salaId: SalaId, mensagemId: MensagemId): Mensagem | undefined {
  const mensagens = mensagensPorSala.get(salaId) || []
  return mensagens.find((m) => m.id === mensagemId)
}

/**
 * Conta mensagens em uma sala
 */
export function contarMensagens(salaId: SalaId, apenasPublicas = false): number {
  const mensagens = mensagensPorSala.get(salaId) || []

  if (apenasPublicas) {
    return mensagens.filter((m) => m.visibilidade === 'publica').length
  }

  return mensagens.length
}

/**
 * Limpa mensagens de uma sala
 */
export function limparMensagensSala(salaId: SalaId): void {
  mensagensPorSala.delete(salaId)
}

/**
 * Prepara contexto de mensagens para enviar a um assistente
 * (apenas mensagens públicas + instruções ocultas para ele)
 */
export function prepararContextoParaAssistente(
  salaId: SalaId,
  assistenteId: AssistenteId,
  limiteContexto = 50
): Mensagem[] {
  const mensagensPublicas = obterMensagensSala(salaId, {
    limite: limiteContexto,
    apenasPublicas: true,
  })

  const instrucoesOcultas = obterMensagensOcultasParaAssistente(salaId, assistenteId)

  // Combinar e ordenar por data
  const todas = [...mensagensPublicas, ...instrucoesOcultas]
  todas.sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())

  return todas
}

// =============================================================================
// HELPERS PARA CRIAR CONTEÚDO
// =============================================================================

/**
 * Cria conteúdo de texto
 */
export function criarConteudoTexto(texto: string): ConteudoMensagem {
  return { tipo: 'texto', texto }
}

/**
 * Cria conteúdo de imagem
 */
export function criarConteudoImagem(
  url: string,
  altText?: string,
  largura?: number,
  altura?: number
): ConteudoMensagem {
  return { tipo: 'imagem', url, altText, largura, altura }
}

/**
 * Cria conteúdo de arquivo
 */
export function criarConteudoArquivo(
  url: string,
  nomeArquivo: string,
  tamanhoBytes: number,
  mimeType: string
): ConteudoMensagem {
  return { tipo: 'arquivo', url, nomeArquivo, tamanhoBytes, mimeType }
}

// =============================================================================
// EXPORTAR PARA TESTES / DEBUG
// =============================================================================

export function obterTodasMensagens(): Map<SalaId, Mensagem[]> {
  return mensagensPorSala
}

export function limparTudo(): void {
  mensagensPorSala.clear()
}
