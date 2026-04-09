export class DatabaseError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function handleDBError(error: unknown): never {
  if (error instanceof Error) {
    throw new DatabaseError(error.message, error)
  }
  throw new DatabaseError('Unknown database error', error)
}

/**
 * Converts a SurrealDB RecordId to a plain string ID
 * @param recordId The RecordId object from SurrealDB
 * @returns The ID portion only (without table prefix)
 */
export function toStringId(recordId: { toString(): string }): string {
  const fullId = recordId.toString()
  const parts = fullId.split(':')
  return parts.length > 1 ? parts.slice(1).join(':') : fullId
}
