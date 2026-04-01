import type {
  Mensagem,
  SalaId,
  AssistenteId,
  DecisaoOrquestrador,
  PayloadParaAssistente,
  RespostaAssistente,
  ConteudoMensagem,
} from '@/types'
import { obterSala } from '@/services/salas/gerenciador-salas'
import {
  criarMensagem,
  prepararContextoParaAssistente,
} from '@/services/mensagens/gerenciador-mensagens'
import { conectarAssistente } from '@/services/assistentes/cliente-assistente'
import { obterAssistente } from '@/services/assistentes/gerenciador-assistentes'

// =============================================================================
// CONFIGURAÇÃO DO ORQUESTRADOR
// =============================================================================

interface ConfiguracaoOrquestradorSala {
  /** Se true, responde automaticamente a qualquer mensagem */
  respostaAutomatica: boolean
  /** Assistente padrão quando não há match específico */
  assistentePadrao?: AssistenteId
  /** Palavras-chave que acionam assistentes específicos */
  gatilhos: Map<string, AssistenteId>
}

const configuracoesPorSala = new Map<SalaId, ConfiguracaoOrquestradorSala>()

// Configuração padrão
const configuracaoPadrao: ConfiguracaoOrquestradorSala = {
  respostaAutomatica: true,
  assistentePadrao: 'assistente-geral',
  gatilhos: new Map([
    ['código', 'assistente-codigo'],
    ['codigo', 'assistente-codigo'],
    ['programação', 'assistente-codigo'],
    ['bug', 'assistente-codigo'],
    ['debug', 'assistente-codigo'],
    ['função', 'assistente-codigo'],
    ['criativo', 'assistente-criativo'],
    ['ideia', 'assistente-criativo'],
    ['brainstorm', 'assistente-criativo'],
    ['escrita', 'assistente-criativo'],
    ['dados', 'assistente-analista'],
    ['estatística', 'assistente-analista'],
    ['análise', 'assistente-analista'],
    ['gráfico', 'assistente-analista'],
  ]),
}

// =============================================================================
// FUNÇÕES DO ORQUESTRADOR
// =============================================================================

/**
 * Obtém a configuração de uma sala
 */
function obterConfiguracao(salaId: SalaId): ConfiguracaoOrquestradorSala {
  return configuracoesPorSala.get(salaId) || configuracaoPadrao
}

/**
 * Define a configuração de uma sala
 */
export function configurarSala(
  salaId: SalaId,
  config: Partial<ConfiguracaoOrquestradorSala>
): void {
  const atual = obterConfiguracao(salaId)
  configuracoesPorSala.set(salaId, { ...atual, ...config })
}

/**
 * Analisa uma mensagem e decide quais assistentes devem responder
 */
export function analisarMensagem(mensagem: Mensagem): DecisaoOrquestrador {
  const sala = obterSala(mensagem.salaId)
  if (!sala) {
    return { deveResponder: false, assistentesAlvo: [] }
  }

  const config = obterConfiguracao(mensagem.salaId)

  // Se não tem resposta automática, não responder
  if (!config.respostaAutomatica) {
    return { deveResponder: false, assistentesAlvo: [] }
  }

  // Extrair texto da mensagem
  const texto = mensagem.conteudo
    .filter((c): c is { tipo: 'texto'; texto: string } => c.tipo === 'texto')
    .map((c) => c.texto.toLowerCase())
    .join(' ')

  // Verificar menções diretas (@assistente-nome)
  const mencoes = texto.match(/@(\w+(-\w+)*)/g) || []
  const assistentesMencionados = mencoes
    .map((m) => m.slice(1)) // Remove @
    .filter((id) => sala.assistentes.includes(id))

  if (assistentesMencionados.length > 0) {
    return {
      deveResponder: true,
      assistentesAlvo: assistentesMencionados,
    }
  }

  // Verificar gatilhos por palavra-chave
  const assistentesPorGatilho: AssistenteId[] = []
  config.gatilhos.forEach((assistenteId, palavra) => {
    if (texto.includes(palavra) && sala.assistentes.includes(assistenteId)) {
      if (!assistentesPorGatilho.includes(assistenteId)) {
        assistentesPorGatilho.push(assistenteId)
      }
    }
  })

  if (assistentesPorGatilho.length > 0) {
    return {
      deveResponder: true,
      assistentesAlvo: assistentesPorGatilho,
    }
  }

  // Usar assistente padrão se configurado e disponível na sala
  if (config.assistentePadrao && sala.assistentes.includes(config.assistentePadrao)) {
    return {
      deveResponder: true,
      assistentesAlvo: [config.assistentePadrao],
    }
  }

  // Se tem assistentes na sala mas nenhum match, usar o primeiro
  if (sala.assistentes.length > 0) {
    return {
      deveResponder: true,
      assistentesAlvo: [sala.assistentes[0]],
    }
  }

  return { deveResponder: false, assistentesAlvo: [] }
}

/**
 * Processa uma mensagem e obtém respostas dos assistentes
 */
export async function processarMensagem(
  mensagem: Mensagem,
  instrucaoOculta?: string
): Promise<RespostaAssistente[]> {
  const decisao = analisarMensagem(mensagem)

  if (!decisao.deveResponder || decisao.assistentesAlvo.length === 0) {
    return []
  }

  const respostas: RespostaAssistente[] = []

  // Processar cada assistente em paralelo
  const promessas = decisao.assistentesAlvo.map(async (assistenteId) => {
    try {
      const cliente = await conectarAssistente(assistenteId)
      if (!cliente) {
        console.warn(`[Orquestrador] Assistente ${assistenteId} não disponível`)
        return null
      }

      // Preparar contexto
      const mensagensContexto = prepararContextoParaAssistente(
        mensagem.salaId,
        assistenteId
      )

      const payload: PayloadParaAssistente = {
        salaId: mensagem.salaId,
        assistenteId,
        mensagens: mensagensContexto,
        instrucaoOculta: instrucaoOculta || decisao.instrucaoOculta,
      }

      const resposta = await cliente.enviarMensagem(payload)
      return resposta
    } catch (erro) {
      console.error(`[Orquestrador] Erro ao processar com ${assistenteId}:`, erro)
      return null
    }
  })

  const resultados = await Promise.all(promessas)

  // Filtrar resultados válidos e salvar como mensagens
  for (const resposta of resultados) {
    if (resposta) {
      // Salvar resposta como mensagem
      criarMensagem({
        salaId: resposta.salaId,
        remetenteId: resposta.assistenteId,
        tipoRemetente: 'assistente',
        conteudo: resposta.conteudo,
        visibilidade: 'publica',
      })

      respostas.push(resposta)
    }
  }

  return respostas
}

/**
 * Envia uma instrução oculta para um assistente específico
 */
export function enviarInstrucaoOculta(
  salaId: SalaId,
  assistenteId: AssistenteId,
  instrucao: string
): Mensagem {
  return criarMensagem({
    salaId,
    remetenteId: 'orquestrador',
    tipoRemetente: 'orquestrador',
    conteudo: [{ tipo: 'texto', texto: instrucao }],
    visibilidade: 'oculta',
    destinatarioId: assistenteId,
  })
}

/**
 * Adiciona um gatilho para uma sala
 */
export function adicionarGatilho(
  salaId: SalaId,
  palavra: string,
  assistenteId: AssistenteId
): void {
  const config = obterConfiguracao(salaId)
  config.gatilhos.set(palavra.toLowerCase(), assistenteId)
  configuracoesPorSala.set(salaId, config)
}

/**
 * Remove um gatilho de uma sala
 */
export function removerGatilho(salaId: SalaId, palavra: string): void {
  const config = obterConfiguracao(salaId)
  config.gatilhos.delete(palavra.toLowerCase())
  configuracoesPorSala.set(salaId, config)
}
