import type { Sala, Convite, SalaId, UsuarioId, AssistenteId, ConviteId } from '@/types'
import { gerarId } from '@/lib/utils'

// =============================================================================
// ARMAZENAMENTO EM MEMÓRIA
// =============================================================================

const salas = new Map<SalaId, Sala>()
const convites = new Map<string, Convite>() // código -> Convite

// =============================================================================
// FUNÇÕES DE SALA
// =============================================================================

/**
 * Cria uma nova sala
 */
export function criarSala(
  nome: string,
  criadorId: UsuarioId,
  assistentesIds: AssistenteId[] = []
): Sala {
  const sala: Sala = {
    id: gerarId(),
    nome,
    criadoPor: criadorId,
    criadoEm: new Date(),
    participantes: [criadorId],
    assistentes: assistentesIds,
  }

  salas.set(sala.id, sala)
  return sala
}

/**
 * Obtém uma sala pelo ID
 */
export function obterSala(salaId: SalaId): Sala | undefined {
  return salas.get(salaId)
}

/**
 * Lista todas as salas de um usuário
 */
export function listarSalasUsuario(usuarioId: UsuarioId): Sala[] {
  return Array.from(salas.values()).filter((sala) =>
    sala.participantes.includes(usuarioId)
  )
}

/**
 * Adiciona um participante à sala
 */
export function adicionarParticipante(salaId: SalaId, usuarioId: UsuarioId): boolean {
  const sala = salas.get(salaId)
  if (!sala) return false

  if (!sala.participantes.includes(usuarioId)) {
    sala.participantes.push(usuarioId)
  }

  return true
}

/**
 * Remove um participante da sala
 */
export function removerParticipante(salaId: SalaId, usuarioId: UsuarioId): boolean {
  const sala = salas.get(salaId)
  if (!sala) return false

  sala.participantes = sala.participantes.filter((id) => id !== usuarioId)
  return true
}

/**
 * Adiciona um assistente à sala
 */
export function adicionarAssistente(salaId: SalaId, assistenteId: AssistenteId): boolean {
  const sala = salas.get(salaId)
  if (!sala) return false

  if (!sala.assistentes.includes(assistenteId)) {
    sala.assistentes.push(assistenteId)
  }

  return true
}

/**
 * Remove um assistente da sala
 */
export function removerAssistente(salaId: SalaId, assistenteId: AssistenteId): boolean {
  const sala = salas.get(salaId)
  if (!sala) return false

  sala.assistentes = sala.assistentes.filter((id) => id !== assistenteId)
  return true
}

/**
 * Deleta uma sala
 */
export function deletarSala(salaId: SalaId): boolean {
  return salas.delete(salaId)
}

// =============================================================================
// FUNÇÕES DE CONVITE
// =============================================================================

/**
 * Gera um código de convite aleatório
 */
function gerarCodigoConvite(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let codigo = ''
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return codigo
}

/**
 * Cria um convite para uma sala
 */
export function criarConvite(
  salaId: SalaId,
  criadorId: UsuarioId,
  expiraEmHoras?: number,
  usosMaximos?: number
): Convite | null {
  const sala = salas.get(salaId)
  if (!sala) return null

  // Verificar se o criador é participante da sala
  if (!sala.participantes.includes(criadorId)) {
    return null
  }

  const codigo = gerarCodigoConvite()
  const convite: Convite = {
    id: gerarId() as ConviteId,
    salaId,
    codigo,
    criadoPor: criadorId,
    criadoEm: new Date(),
    expiraEm: expiraEmHoras
      ? new Date(Date.now() + expiraEmHoras * 60 * 60 * 1000)
      : undefined,
    usosRestantes: usosMaximos,
  }

  convites.set(codigo, convite)
  sala.conviteAtivo = convite

  return convite
}

/**
 * Obtém um convite pelo código
 */
export function obterConvite(codigo: string): Convite | undefined {
  return convites.get(codigo.toUpperCase())
}

/**
 * Usa um convite para entrar em uma sala
 */
export function usarConvite(codigo: string, usuarioId: UsuarioId): Sala | null {
  const convite = convites.get(codigo.toUpperCase())
  if (!convite) return null

  // Verificar expiração
  if (convite.expiraEm && new Date() > convite.expiraEm) {
    convites.delete(codigo.toUpperCase())
    return null
  }

  // Verificar usos restantes
  if (convite.usosRestantes !== undefined && convite.usosRestantes <= 0) {
    convites.delete(codigo.toUpperCase())
    return null
  }

  // Adicionar usuário à sala
  const sucesso = adicionarParticipante(convite.salaId, usuarioId)
  if (!sucesso) return null

  // Decrementar usos restantes
  if (convite.usosRestantes !== undefined) {
    convite.usosRestantes--
    if (convite.usosRestantes <= 0) {
      convites.delete(codigo.toUpperCase())
    }
  }

  return salas.get(convite.salaId) || null
}

/**
 * Invalida um convite
 */
export function invalidarConvite(codigo: string): boolean {
  return convites.delete(codigo.toUpperCase())
}

// =============================================================================
// EXPORTAR PARA TESTES / DEBUG
// =============================================================================

export function obterTodasSalas(): Sala[] {
  return Array.from(salas.values())
}

export function limparTudo(): void {
  salas.clear()
  convites.clear()
}
