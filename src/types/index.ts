/**
 * Tipos e interfaces base do Multi-LLM Chat
 */

// =============================================================================
// IDENTIFICADORES
// =============================================================================

export type UsuarioId = string
export type SalaId = string
export type MensagemId = string
export type AssistenteId = string
export type ConviteId = string

// =============================================================================
// USUÁRIO
// =============================================================================

export interface Usuario {
  id: UsuarioId
  nome: string
  email: string
  avatarUrl?: string
  criadoEm: Date
}

// =============================================================================
// ASSISTENTE
// =============================================================================

export type StatusAssistente = 'online' | 'offline' | 'ocupado'

export interface Assistente {
  id: AssistenteId
  nome: string
  descricao: string
  avatarUrl?: string
  endpoint: string
  status: StatusAssistente
}

// =============================================================================
// SALA
// =============================================================================

export interface Sala {
  id: SalaId
  nome: string
  criadoPor: UsuarioId
  criadoEm: Date
  participantes: UsuarioId[]
  assistentes: AssistenteId[]
  conviteAtivo?: Convite
}

export interface Convite {
  id: ConviteId
  salaId: SalaId
  codigo: string
  criadoPor: UsuarioId
  criadoEm: Date
  expiraEm?: Date
  usosRestantes?: number
}

// =============================================================================
// MENSAGEM
// =============================================================================

export type TipoRemetente = 'usuario' | 'assistente' | 'orquestrador'
export type VisibilidadeMensagem = 'publica' | 'oculta'
export type TipoConteudo = 'texto' | 'imagem' | 'arquivo'

export interface ConteudoTexto {
  tipo: 'texto'
  texto: string
}

export interface ConteudoImagem {
  tipo: 'imagem'
  url: string
  altText?: string
  largura?: number
  altura?: number
}

export interface ConteudoArquivo {
  tipo: 'arquivo'
  url: string
  nomeArquivo: string
  tamanhoBytes: number
  mimeType: string
}

export type ConteudoMensagem = ConteudoTexto | ConteudoImagem | ConteudoArquivo

export interface Mensagem {
  id: MensagemId
  salaId: SalaId
  remetenteId: UsuarioId | AssistenteId
  tipoRemetente: TipoRemetente
  conteudo: ConteudoMensagem[]
  visibilidade: VisibilidadeMensagem
  destinatarioId?: AssistenteId // Para instruções ocultas do orquestrador
  criadoEm: Date
}

// =============================================================================
// EVENTOS WEBSOCKET
// =============================================================================

export interface EventoEntrarSala {
  salaId: SalaId
  usuarioId: UsuarioId
}

export interface EventoSairSala {
  salaId: SalaId
  usuarioId: UsuarioId
}

export interface EventoNovaMensagem {
  mensagem: Mensagem
}

export interface EventoDigitando {
  salaId: SalaId
  remetenteId: UsuarioId | AssistenteId
  tipoRemetente: TipoRemetente
  estaDigitando: boolean
}

export interface EventoAssistenteStatus {
  assistenteId: AssistenteId
  status: StatusAssistente
}

// =============================================================================
// PAYLOADS PARA ASSISTENTES
// =============================================================================

export interface PayloadParaAssistente {
  salaId: SalaId
  assistenteId: AssistenteId
  mensagens: Mensagem[]
  instrucaoOculta?: string
}

export interface RespostaAssistente {
  salaId: SalaId
  assistenteId: AssistenteId
  conteudo: ConteudoMensagem[]
}

// =============================================================================
// ORQUESTRADOR
// =============================================================================

export interface DecisaoOrquestrador {
  deveResponder: boolean
  assistentesAlvo: AssistenteId[]
  instrucaoOculta?: string
}

export interface ConfiguracaoOrquestrador {
  salaId: SalaId
  regras: RegraOrquestracao[]
}

export interface RegraOrquestracao {
  condicao: string // Expressão ou palavra-chave
  assistenteAlvo: AssistenteId
  prioridade: number
}
