'use client'

import { io, Socket } from 'socket.io-client'
import type {
  EventoEntrarSala,
  EventoSairSala,
  EventoDigitando,
  EventoNovaMensagem,
  Mensagem,
  SalaId,
  UsuarioId,
} from '@/types'

let socket: Socket | null = null

/**
 * Inicializa a conexão WebSocket
 */
export function conectar(usuarioId: UsuarioId): Socket {
  if (socket?.connected) {
    return socket
  }

  socket = io({
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('[WS Cliente] Conectado')
    socket?.emit('autenticar', usuarioId)
  })

  socket.on('disconnect', () => {
    console.log('[WS Cliente] Desconectado')
  })

  socket.on('connect_error', (erro) => {
    console.error('[WS Cliente] Erro de conexão:', erro)
  })

  return socket
}

/**
 * Desconecta do WebSocket
 */
export function desconectar(): void {
  socket?.disconnect()
  socket = null
}

/**
 * Obtém a instância do socket atual
 */
export function obterSocket(): Socket | null {
  return socket
}

/**
 * Entra em uma sala
 */
export function entrarSala(salaId: SalaId, usuarioId: UsuarioId): void {
  socket?.emit('entrar-sala', { salaId, usuarioId } as EventoEntrarSala)
}

/**
 * Sai de uma sala
 */
export function sairSala(salaId: SalaId, usuarioId: UsuarioId): void {
  socket?.emit('sair-sala', { salaId, usuarioId } as EventoSairSala)
}

/**
 * Envia uma mensagem
 */
export function enviarMensagem(mensagem: Mensagem): void {
  socket?.emit('enviar-mensagem', mensagem)
}

/**
 * Indica que o usuário está digitando
 */
export function indicarDigitando(
  salaId: SalaId,
  remetenteId: UsuarioId,
  estaDigitando: boolean
): void {
  socket?.emit('digitando', {
    salaId,
    remetenteId,
    tipoRemetente: 'usuario',
    estaDigitando,
  } as EventoDigitando)
}

// =============================================================================
// LISTENERS
// =============================================================================

type CallbackNovaMensagem = (evento: EventoNovaMensagem) => void
type CallbackUsuarioEntrou = (dados: { usuarioId: UsuarioId; salaId: SalaId }) => void
type CallbackUsuarioSaiu = (dados: { usuarioId: UsuarioId; salaId: SalaId }) => void
type CallbackDigitando = (evento: EventoDigitando) => void

/**
 * Registra listener para novas mensagens
 */
export function aoReceberMensagem(callback: CallbackNovaMensagem): () => void {
  socket?.on('nova-mensagem', callback)
  return () => socket?.off('nova-mensagem', callback)
}

/**
 * Registra listener para quando um usuário entra
 */
export function aoUsuarioEntrar(callback: CallbackUsuarioEntrou): () => void {
  socket?.on('usuario-entrou', callback)
  return () => socket?.off('usuario-entrou', callback)
}

/**
 * Registra listener para quando um usuário sai
 */
export function aoUsuarioSair(callback: CallbackUsuarioSaiu): () => void {
  socket?.on('usuario-saiu', callback)
  return () => socket?.off('usuario-saiu', callback)
}

/**
 * Registra listener para indicador de digitação
 */
export function aoUsuarioDigitar(callback: CallbackDigitando): () => void {
  socket?.on('usuario-digitando', callback)
  return () => socket?.off('usuario-digitando', callback)
}
