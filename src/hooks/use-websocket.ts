'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  conectar,
  desconectar,
  entrarSala as wsEntrarSala,
  sairSala as wsSairSala,
  enviarMensagem as wsEnviarMensagem,
  indicarDigitando as wsIndicarDigitando,
  aoReceberMensagem,
  aoUsuarioEntrar,
  aoUsuarioSair,
  aoUsuarioDigitar,
} from '@/services/websocket'
import type { Mensagem, EventoDigitando, SalaId, UsuarioId } from '@/types'

interface UseWebSocketReturn {
  conectado: boolean
  mensagens: Mensagem[]
  usuariosDigitando: Map<string, boolean>
  entrarSala: (salaId: SalaId) => void
  sairSala: (salaId: SalaId) => void
  enviarMensagem: (mensagem: Mensagem) => void
  indicarDigitando: (salaId: SalaId, estaDigitando: boolean) => void
}

export function useWebSocket(usuarioId: UsuarioId): UseWebSocketReturn {
  const [conectado, setConectado] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [usuariosDigitando, setUsuariosDigitando] = useState<Map<string, boolean>>(new Map())
  const inicializado = useRef(false)

  // Conectar ao montar
  useEffect(() => {
    if (inicializado.current) return
    inicializado.current = true

    const socket = conectar(usuarioId)

    socket.on('connect', () => {
      setConectado(true)
    })

    socket.on('disconnect', () => {
      setConectado(false)
    })

    // Listener de novas mensagens
    const cancelarMensagem = aoReceberMensagem((evento) => {
      setMensagens((atual) => [...atual, evento.mensagem])
    })

    // Listener de digitação
    const cancelarDigitando = aoUsuarioDigitar((evento: EventoDigitando) => {
      setUsuariosDigitando((atual) => {
        const novo = new Map(atual)
        if (evento.estaDigitando) {
          novo.set(evento.remetenteId, true)
        } else {
          novo.delete(evento.remetenteId)
        }
        return novo
      })
    })

    return () => {
      cancelarMensagem()
      cancelarDigitando()
      desconectar()
    }
  }, [usuarioId])

  const entrarSala = useCallback(
    (salaId: SalaId) => {
      wsEntrarSala(salaId, usuarioId)
    },
    [usuarioId]
  )

  const sairSala = useCallback(
    (salaId: SalaId) => {
      wsSairSala(salaId, usuarioId)
    },
    [usuarioId]
  )

  const enviarMensagem = useCallback((mensagem: Mensagem) => {
    wsEnviarMensagem(mensagem)
  }, [])

  const indicarDigitando = useCallback(
    (salaId: SalaId, estaDigitando: boolean) => {
      wsIndicarDigitando(salaId, usuarioId, estaDigitando)
    },
    [usuarioId]
  )

  return {
    conectado,
    mensagens,
    usuariosDigitando,
    entrarSala,
    sairSala,
    enviarMensagem,
    indicarDigitando,
  }
}
