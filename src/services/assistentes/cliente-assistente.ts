import type {
  AssistenteId,
  PayloadParaAssistente,
  RespostaAssistente,
  ConteudoMensagem,
} from '@/types'

// =============================================================================
// INTERFACE DO CLIENTE DE ASSISTENTE
// =============================================================================

export interface ClienteAssistente {
  id: AssistenteId
  conectar(): Promise<void>
  desconectar(): void
  enviarMensagem(payload: PayloadParaAssistente): Promise<RespostaAssistente>
  estaConectado(): boolean
}

// =============================================================================
// CLIENTE MOCK (para desenvolvimento)
// =============================================================================

/**
 * Cliente mock que simula respostas de um assistente
 */
export class ClienteAssistenteMock implements ClienteAssistente {
  id: AssistenteId
  private conectado = false
  private nome: string
  private personalidade: string

  constructor(id: AssistenteId, nome: string, personalidade: string) {
    this.id = id
    this.nome = nome
    this.personalidade = personalidade
  }

  async conectar(): Promise<void> {
    // Simular delay de conexão
    await new Promise((resolve) => setTimeout(resolve, 100))
    this.conectado = true
    console.log(`[Mock] ${this.nome} conectado`)
  }

  desconectar(): void {
    this.conectado = false
    console.log(`[Mock] ${this.nome} desconectado`)
  }

  async enviarMensagem(payload: PayloadParaAssistente): Promise<RespostaAssistente> {
    if (!this.conectado) {
      throw new Error('Assistente não está conectado')
    }

    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

    // Extrair última mensagem do usuário
    const ultimaMensagem = payload.mensagens
      .filter((m) => m.tipoRemetente === 'usuario')
      .pop()

    const textoUsuario = ultimaMensagem?.conteudo
      .filter((c): c is { tipo: 'texto'; texto: string } => c.tipo === 'texto')
      .map((c) => c.texto)
      .join(' ') || ''

    // Gerar resposta baseada na personalidade
    const resposta = this.gerarResposta(textoUsuario, payload.instrucaoOculta)

    const conteudo: ConteudoMensagem[] = [{ tipo: 'texto', texto: resposta }]

    return {
      salaId: payload.salaId,
      assistenteId: this.id,
      conteudo,
    }
  }

  estaConectado(): boolean {
    return this.conectado
  }

  private gerarResposta(mensagemUsuario: string, instrucaoOculta?: string): string {
    // Respostas mock baseadas na personalidade
    const respostas: Record<string, string[]> = {
      geral: [
        `Entendi! Você disse: "${mensagemUsuario}". Como posso ajudar mais?`,
        `Interessante pergunta sobre "${mensagemUsuario.slice(0, 30)}...". Deixa eu pensar...`,
        `Boa observação! Vou considerar isso.`,
      ],
      codigo: [
        `Analisando o código... "${mensagemUsuario.slice(0, 20)}..." parece ser uma questão de implementação.`,
        `Do ponto de vista técnico, eu sugeriria considerar algumas alternativas.`,
        `Esse é um padrão comum em desenvolvimento. Posso explicar mais detalhadamente.`,
      ],
      criativo: [
        `Que ideia fascinante! "${mensagemUsuario.slice(0, 20)}..." me fez pensar em várias possibilidades.`,
        `Adorei a criatividade! Vamos expandir essa ideia juntos.`,
        `Interessante perspectiva! Isso me lembra de algumas referências artísticas.`,
      ],
      analista: [
        `Os dados sugerem que "${mensagemUsuario.slice(0, 20)}..." tem implicações interessantes.`,
        `Analisando os padrões, posso identificar algumas tendências.`,
        `Estatisticamente falando, essa abordagem parece promissora.`,
      ],
    }

    const tipoRespostas = respostas[this.personalidade] || respostas.geral
    const respostaBase = tipoRespostas[Math.floor(Math.random() * tipoRespostas.length)]

    // Se houver instrução oculta, ajustar resposta
    if (instrucaoOculta) {
      return `[Seguindo instrução] ${respostaBase}`
    }

    return respostaBase
  }
}

// =============================================================================
// FACTORY DE CLIENTES
// =============================================================================

import { ClienteOllama } from './cliente-ollama'
import { obterAssistente, modelosPorAssistente } from './gerenciador-assistentes'

const clientesAtivos = new Map<AssistenteId, ClienteAssistente>()

// Flag para usar mock ou Ollama real
const USAR_OLLAMA = process.env.USAR_OLLAMA === 'true'

/**
 * Obtém ou cria um cliente para um assistente
 */
export function obterClienteAssistente(assistenteId: AssistenteId): ClienteAssistente | null {
  // Se já existe um cliente ativo, retorna
  if (clientesAtivos.has(assistenteId)) {
    return clientesAtivos.get(assistenteId)!
  }

  const assistente = obterAssistente(assistenteId)
  if (!assistente) return null

  let cliente: ClienteAssistente

  if (USAR_OLLAMA) {
    // Usar cliente Ollama real
    const modelo = modelosPorAssistente.get(assistenteId) || 'llama3.2'
    cliente = new ClienteOllama(assistenteId, assistente.endpoint, modelo)
  } else {
    // Usar cliente mock para desenvolvimento
    const personalidades: Record<string, string> = {
      'assistente-geral': 'geral',
      'assistente-codigo': 'codigo',
      'assistente-criativo': 'criativo',
      'assistente-analista': 'analista',
    }
    cliente = new ClienteAssistenteMock(
      assistenteId,
      assistente.nome,
      personalidades[assistenteId] || 'geral'
    )
  }
  clientesAtivos.set(assistenteId, cliente)

  return cliente
}

/**
 * Conecta a um assistente e retorna o cliente
 */
export async function conectarAssistente(assistenteId: AssistenteId): Promise<ClienteAssistente | null> {
  const cliente = obterClienteAssistente(assistenteId)
  if (!cliente) return null

  if (!cliente.estaConectado()) {
    await cliente.conectar()
  }

  return cliente
}

/**
 * Desconecta de um assistente
 */
export function desconectarAssistente(assistenteId: AssistenteId): void {
  const cliente = clientesAtivos.get(assistenteId)
  if (cliente) {
    cliente.desconectar()
    clientesAtivos.delete(assistenteId)
  }
}

/**
 * Desconecta de todos os assistentes
 */
export function desconectarTodos(): void {
  clientesAtivos.forEach((cliente) => cliente.desconectar())
  clientesAtivos.clear()
}
