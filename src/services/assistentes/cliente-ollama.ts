import type {
  AssistenteId,
  PayloadParaAssistente,
  RespostaAssistente,
  ConteudoMensagem,
} from '@/types'
import { ClienteAssistente } from './cliente-assistente'

// =============================================================================
// TIPOS OLLAMA
// =============================================================================

interface OllamaMensagem {
  role: 'system' | 'user' | 'assistant'
  content: string
  images?: string[] // Para modelos multimodais
}

interface OllamaRespostaChat {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  eval_count?: number
}

interface OllamaModelo {
  name: string
  modified_at: string
  size: number
}

// =============================================================================
// CLIENTE OLLAMA
// =============================================================================

export class ClienteOllama implements ClienteAssistente {
  id: AssistenteId
  private endpoint: string
  private modelo: string
  private conectado = false
  private timeout = 60000 // 60 segundos

  constructor(id: AssistenteId, endpoint: string, modelo: string) {
    this.id = id
    this.endpoint = endpoint
    this.modelo = modelo
  }

  async conectar(): Promise<void> {
    try {
      // Verificar se Ollama está respondendo
      const resposta = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })

      if (!resposta.ok) {
        throw new Error(`Ollama não está respondendo: ${resposta.status}`)
      }

      // Verificar se o modelo existe
      const dados = await resposta.json()
      const modelos: OllamaModelo[] = dados.models || []
      const modeloExiste = modelos.some((m) => m.name.startsWith(this.modelo))

      if (!modeloExiste) {
        console.warn(
          `[Ollama] Modelo ${this.modelo} não encontrado. Modelos disponíveis:`,
          modelos.map((m) => m.name)
        )
        // Não falha, pode ser que o modelo ainda não foi baixado
      }

      this.conectado = true
      console.log(`[Ollama] Conectado a ${this.endpoint} (modelo: ${this.modelo})`)
    } catch (erro) {
      this.conectado = false
      throw new Error(`Falha ao conectar ao Ollama: ${erro}`)
    }
  }

  desconectar(): void {
    this.conectado = false
    console.log(`[Ollama] Desconectado de ${this.endpoint}`)
  }

  async enviarMensagem(payload: PayloadParaAssistente): Promise<RespostaAssistente> {
    if (!this.conectado) {
      await this.conectar()
    }

    // Converter mensagens para formato Ollama
    const mensagens = this.converterMensagens(payload)

    try {
      const resposta = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelo,
          messages: mensagens,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!resposta.ok) {
        const erro = await resposta.text()
        throw new Error(`Erro Ollama: ${resposta.status} - ${erro}`)
      }

      const dados: OllamaRespostaChat = await resposta.json()

      const conteudo: ConteudoMensagem[] = [
        { tipo: 'texto', texto: dados.message.content },
      ]

      return {
        salaId: payload.salaId,
        assistenteId: this.id,
        conteudo,
      }
    } catch (erro) {
      if (erro instanceof Error && erro.name === 'TimeoutError') {
        throw new Error(`Timeout ao aguardar resposta do Ollama (${this.timeout}ms)`)
      }
      throw erro
    }
  }

  estaConectado(): boolean {
    return this.conectado
  }

  private converterMensagens(payload: PayloadParaAssistente): OllamaMensagem[] {
    const mensagens: OllamaMensagem[] = []

    // Instrução oculta do orquestrador como system message
    if (payload.instrucaoOculta) {
      mensagens.push({
        role: 'system',
        content: payload.instrucaoOculta,
      })
    }

    // Converter histórico de mensagens
    for (const msg of payload.mensagens) {
      // Extrair texto
      const textos = msg.conteudo
        .filter((c): c is { tipo: 'texto'; texto: string } => c.tipo === 'texto')
        .map((c) => c.texto)

      // Extrair imagens (para modelos multimodais)
      const imagens = msg.conteudo
        .filter((c): c is { tipo: 'imagem'; url: string } => c.tipo === 'imagem')
        .map((c) => c.url)

      if (textos.length > 0 || imagens.length > 0) {
        const ollamaMsg: OllamaMensagem = {
          role: this.mapearRole(msg.tipoRemetente),
          content: textos.join('\n'),
        }

        if (imagens.length > 0) {
          ollamaMsg.images = imagens
        }

        mensagens.push(ollamaMsg)
      }
    }

    return mensagens
  }

  private mapearRole(tipoRemetente: string): 'user' | 'assistant' | 'system' {
    switch (tipoRemetente) {
      case 'usuario':
        return 'user'
      case 'assistente':
        return 'assistant'
      case 'orquestrador':
        return 'system'
      default:
        return 'user'
    }
  }
}

// =============================================================================
// VERIFICAR STATUS DO OLLAMA
// =============================================================================

/**
 * Verifica se um endpoint Ollama está online
 */
export async function verificarOllamaOnline(endpoint: string): Promise<boolean> {
  try {
    const resposta = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    return resposta.ok
  } catch {
    return false
  }
}

/**
 * Lista modelos disponíveis em um endpoint Ollama
 */
export async function listarModelosOllama(endpoint: string): Promise<string[]> {
  try {
    const resposta = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!resposta.ok) return []

    const dados = await resposta.json()
    return (dados.models || []).map((m: OllamaModelo) => m.name)
  } catch {
    return []
  }
}
