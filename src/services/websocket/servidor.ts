import { Server as SocketIOServer, Socket } from 'socket.io'
import type {
  EventoEntrarSala,
  EventoSairSala,
  EventoNovaMensagem,
  EventoDigitando,
  Mensagem,
  SalaId,
  UsuarioId,
} from '@/types'

// Mapa de conexões: socketId -> usuarioId
const conexoes = new Map<string, UsuarioId>()

// Mapa de salas: salaId -> Set<socketId>
const salasConexoes = new Map<SalaId, Set<string>>()

/**
 * Configura os handlers do WebSocket
 */
export function configurarWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Nova conexão: ${socket.id}`)

    // Autenticar usuário
    socket.on('autenticar', (usuarioId: UsuarioId) => {
      conexoes.set(socket.id, usuarioId)
      console.log(`[WS] Usuário autenticado: ${usuarioId}`)
    })

    // Entrar em uma sala
    socket.on('entrar-sala', ({ salaId, usuarioId }: EventoEntrarSala) => {
      socket.join(salaId)

      if (!salasConexoes.has(salaId)) {
        salasConexoes.set(salaId, new Set())
      }
      salasConexoes.get(salaId)?.add(socket.id)

      // Notificar outros participantes
      socket.to(salaId).emit('usuario-entrou', { usuarioId, salaId })
      console.log(`[WS] Usuário ${usuarioId} entrou na sala ${salaId}`)
    })

    // Sair de uma sala
    socket.on('sair-sala', ({ salaId, usuarioId }: EventoSairSala) => {
      socket.leave(salaId)
      salasConexoes.get(salaId)?.delete(socket.id)

      // Notificar outros participantes
      socket.to(salaId).emit('usuario-saiu', { usuarioId, salaId })
      console.log(`[WS] Usuário ${usuarioId} saiu da sala ${salaId}`)
    })

    // Enviar mensagem
    socket.on('enviar-mensagem', (mensagem: Mensagem) => {
      const { salaId, visibilidade } = mensagem

      // Mensagens ocultas vão apenas para o orquestrador processar
      if (visibilidade === 'publica') {
        io.to(salaId).emit('nova-mensagem', { mensagem } as EventoNovaMensagem)
      }

      // TODO: Enviar para o orquestrador processar
      console.log(`[WS] Mensagem na sala ${salaId}: ${JSON.stringify(mensagem.conteudo)}`)
    })

    // Indicador de digitação
    socket.on('digitando', (evento: EventoDigitando) => {
      socket.to(evento.salaId).emit('usuario-digitando', evento)
    })

    // Desconexão
    socket.on('disconnect', () => {
      const usuarioId = conexoes.get(socket.id)

      // Remover de todas as salas
      salasConexoes.forEach((socketIds, salaId) => {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id)
          if (usuarioId) {
            io.to(salaId).emit('usuario-saiu', { usuarioId, salaId })
          }
        }
      })

      conexoes.delete(socket.id)
      console.log(`[WS] Desconectado: ${socket.id}`)
    })
  })
}

/**
 * Envia mensagem para uma sala específica
 */
export function enviarParaSala(
  io: SocketIOServer,
  salaId: SalaId,
  evento: string,
  dados: unknown
): void {
  io.to(salaId).emit(evento, dados)
}

/**
 * Obtém os usuários conectados em uma sala
 */
export function obterUsuariosSala(salaId: SalaId): UsuarioId[] {
  const socketIds = salasConexoes.get(salaId)
  if (!socketIds) return []

  return Array.from(socketIds)
    .map((socketId) => conexoes.get(socketId))
    .filter((id): id is UsuarioId => id !== undefined)
}
