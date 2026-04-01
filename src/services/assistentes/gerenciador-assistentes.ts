import type { Assistente, AssistenteId, StatusAssistente } from '@/types'

// =============================================================================
// CONFIGURAÇÃO DOS ASSISTENTES (Ollama)
// =============================================================================

const assistentes = new Map<AssistenteId, Assistente>()

/**
 * Assistentes configurados para conectar aos containers Ollama
 * Cada assistente usa um endpoint/modelo específico
 */
const assistentesConfig: (Assistente & { modelo: string })[] = [
  {
    id: 'assistente-geral',
    nome: 'Assistente Geral',
    descricao: 'Assistente de propósito geral (Llama 3.2)',
    avatarUrl: '/avatars/assistente-geral.png',
    endpoint: process.env.OLLAMA_GERAL_URL || 'http://localhost:11434',
    modelo: 'llama3.2',
    status: 'online',
  },
  {
    id: 'assistente-codigo',
    nome: 'Especialista em Código',
    descricao: 'Ajuda com programação e debugging (CodeLlama)',
    avatarUrl: '/avatars/assistente-codigo.png',
    endpoint: process.env.OLLAMA_CODIGO_URL || 'http://localhost:11435',
    modelo: 'codellama',
    status: 'online',
  },
  {
    id: 'assistente-criativo',
    nome: 'Assistente Criativo',
    descricao: 'Escrita criativa, brainstorming e ideação',
    avatarUrl: '/avatars/assistente-criativo.png',
    endpoint: process.env.OLLAMA_CRIATIVO_URL || 'http://localhost:11436',
    modelo: 'neural-chat',
    status: 'offline',
  },
  {
    id: 'assistente-analista',
    nome: 'Analista de Dados',
    descricao: 'Análise de dados, estatísticas e visualizações',
    avatarUrl: '/avatars/assistente-analista.png',
    endpoint: process.env.OLLAMA_GERAL_URL || 'http://localhost:11434',
    modelo: 'mistral',
    status: 'online',
  },
]

// Mapa de modelos por assistente (para o cliente Ollama)
export const modelosPorAssistente = new Map<AssistenteId, string>()

// Inicializar assistentes
assistentesConfig.forEach((a) => {
  const { modelo, ...assistente } = a
  assistentes.set(assistente.id, assistente)
  modelosPorAssistente.set(assistente.id, modelo)
})

// =============================================================================
// FUNÇÕES
// =============================================================================

/**
 * Lista todos os assistentes disponíveis
 */
export function listarAssistentes(): Assistente[] {
  return Array.from(assistentes.values())
}

/**
 * Lista apenas assistentes online
 */
export function listarAssistentesOnline(): Assistente[] {
  return Array.from(assistentes.values()).filter((a) => a.status === 'online')
}

/**
 * Obtém um assistente pelo ID
 */
export function obterAssistente(assistenteId: AssistenteId): Assistente | undefined {
  return assistentes.get(assistenteId)
}

/**
 * Atualiza o status de um assistente
 */
export function atualizarStatusAssistente(
  assistenteId: AssistenteId,
  status: StatusAssistente
): boolean {
  const assistente = assistentes.get(assistenteId)
  if (!assistente) return false

  assistente.status = status
  return true
}

/**
 * Registra um novo assistente (para quando containers se conectarem)
 */
export function registrarAssistente(assistente: Assistente): void {
  assistentes.set(assistente.id, assistente)
}

/**
 * Remove um assistente
 */
export function removerAssistente(assistenteId: AssistenteId): boolean {
  return assistentes.delete(assistenteId)
}

/**
 * Verifica se um assistente está disponível
 */
export function assistenteDisponivel(assistenteId: AssistenteId): boolean {
  const assistente = assistentes.get(assistenteId)
  return assistente?.status === 'online'
}
