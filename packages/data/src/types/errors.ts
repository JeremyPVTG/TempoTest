export type DataErrorCode =
  | "E.NETWORK_OFFLINE"
  | "E.TIMEOUT"
  | "E.RLS_FORBIDDEN"
  | "E.VALIDATION_FAILED"
  | "E.CONFLICT_VERSION"
  | "E.CAP_EXCEEDED"
  | "E.PURCHASE_NOT_FOUND"
  | "E.INVALID_SKU"
  | "E.NETWORK_ERROR"
  | "E.UNKNOWN"

export class DataError extends Error {
  code: DataErrorCode
  meta?: Record<string, unknown>

  constructor(code: DataErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.meta = meta
  }
}

export function toDataError(err: unknown): DataError {
  const message = typeof err === 'object' && err && 'message' in err ? String((err as Error).message) : 'Unknown error'
  const status = typeof err === 'object' && err && 'status' in err ? Number((err as { status: number }).status) : undefined
  
  if (status === 401 || status === 403) return new DataError('E.RLS_FORBIDDEN', message)
  if (status === 409) return new DataError('E.CONFLICT_VERSION', message)
  if (status === 408 || message.includes('timeout')) return new DataError('E.TIMEOUT', message)
  if (!navigator.onLine) return new DataError('E.NETWORK_OFFLINE', message)
  if (status && status >= 400 && status < 500) return new DataError('E.VALIDATION_FAILED', message)
  if (status && status >= 500) return new DataError('E.UNKNOWN', message)
  
  return new DataError('E.UNKNOWN', message)
}

