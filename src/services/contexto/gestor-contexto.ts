import type { Mensagem, SalaId, AssistenteId } from '@/types'
import { obterMensagensSala, prepararContextoParaAssistente } from '@/services/mensagens'

// =============================================================================
// CONFIGURAÇÃO DE CONTEXTO
// =============================================================================

interface ConfiguracaoContexto {
  /** Número máximo de mensagens no contexto */
  limiteMaximo: number
  /** Número máximo de tokens (estimado) */
  limiteTokens: number
  /** Se deve incluir mensagens de sistema */
  incluirMensagensSistema: boolean
}

const configuracaoPadrao: ConfiguracaoContexto = {
  limiteMaximo: 100,
  limiteTokens: 4000,
  incluirMensagensSistema: true,
}

const configuracoesPorSala = new Map<SalaId, ConfiguracaoContexto>()

// =============================================================================
// FUNÇÕES DE CONTEXTO
// =============================================================================

/**
 * Obtém a configuração de contexto para uma sala
 */
export function obterConfiguracao(salaId: SalaId): ConfiguracaoContexto {
  return configuracoesPorSala.get(salaId) || configuracaoPadrao
}

/**
 * Define a configuração de contexto para uma sala
 */
export function configurarContexto(
  salaId: SalaId,
  config: Partial<ConfiguracaoContexto>
): void {
  const atual = obterConfiguracao(salaId)
  configuracoesPorSala.set(salaId, { ...atual, ...config })
}

/**
 * Estima o número de tokens em um texto (aproximação simples)
 */
function estimarTokens(texto: string): number {
  // Aproximação: ~4 caracteres por token em português
  return Math.ceil(texto.length / 4)
}

/**
 * Estima tokens de uma mensagem
 */
function estimarTokensMensagem(mensagem: Mensagem): number {
  let total = 0

  for (const conteudo of mensagem.conteudo) {
    if (conteudo.tipo === 'texto') {
      total += estimarTokens(conteudo.texto)
    } else if (conteudo.tipo === 'imagem') {
      // Imagens consomem tokens fixos (aproximação)
      total += 100
    } else if (conteudo.tipo === 'arquivo') {
      // Arquivos: só o nome
      total += estimarTokens(conteudo.nomeArquivo)
    }
  }

  // Overhead de metadados
  total += 10

  return total
}

/**
 * Monta o contexto para um assistente, respeitando limites de tokens
 */
export function montarContextoParaAssistente(
  salaId: SalaId,
  assistenteId: AssistenteId
): Mensagem[] {
  const config = obterConfiguracao(salaId)
  const todasMensagens = prepararContextoParaAssistente(
    salaId,
    assistenteId,
    config.limiteMaximo
  )

  // Filtrar por limite de tokens
  const mensagensContexto: Mensagem[] = []
  let tokensUsados = 0

  // Processar do mais recente para o mais antigo
  const mensagensInvertidas = [...todasMensagens].reverse()

  for (const mensagem of mensagensInvertidas) {
    const tokensMensagem = estimarTokensMensagem(mensagem)

    if (tokensUsados + tokensMensagem > config.limiteTokens) {
      break
    }

    mensagensContexto.unshift(mensagem)
    tokensUsados += tokensMensagem
  }

  return mensagensContexto
}

/**
 * Obtém um resumo do contexto para debugging
 */
export function resumirContexto(salaId: SalaId): {
  totalMensagens: number
  tokensEstimados: number
  participantes: Set<string>
} {
  const mensagens = obterMensagensSala(salaId)
  const participantes = new Set<string>()
  let tokensEstimados = 0

  for (const mensagem of mensagens) {
    participantes.add(mensagem.remetenteId)
    tokensEstimados += estimarTokensMensagem(mensagem)
  }

  return {
    totalMensagens: mensagens.length,
    tokensEstimados,
    participantes,
  }
}

/**
 * Verifica se o contexto de uma sala está próximo do limite
 */
export function contextoProximoDoLimite(salaId: SalaId): boolean {
  const config = obterConfiguracao(salaId)
  const resumo = resumirContexto(salaId)

  // Alerta se usar mais de 80% dos tokens
  return resumo.tokensEstimados > config.limiteTokens * 0.8
}

/**
 * Limpa o contexto de uma sala (mantém apenas N mensagens recentes)
 */
export function compactarContexto(salaId: SalaId, manterUltimas = 20): void {
  // TODO: Implementar compactação/resumo do contexto antigo
  // Por enquanto, isso é gerenciado pelo limite de mensagens
  console.log(`[Contexto] Compactando sala ${salaId}, mantendo ${manterUltimas} mensagens`)
}
