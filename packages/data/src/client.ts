import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ZodSchema } from 'zod'
import { DataError, toDataError } from './types/errors'

export type SupabaseOpts = {
  url: string
  anonKey: string
  fetch?: typeof fetch
  headers?: Record<string, string>
}

export type RequestFn = <T>(
  op: (c: SupabaseClient) => Promise<{ data: unknown; error: unknown }>,
  parse: ZodSchema<T>
) => Promise<T>

export function createSupabaseClient(opts: SupabaseOpts) {
  const client = createClient(opts.url, opts.anonKey, {
    global: { fetch: opts.fetch, headers: opts.headers },
  })

  // Decorate headers for tracing (x-request-id, x-timezone, etc.)
  let decorate: (h: Record<string, string>) => Record<string, string> = (h) => h
  function setRequestDecorator(cb: (h: Record<string, string>) => Record<string, string>) {
    decorate = cb
  }

  const request: RequestFn = async (op, parse) => {
    try {
      const { data, error } = await op(client)
      if (error) throw toDataError(error)
      const parsed = parse.safeParse(data)
      if (!parsed.success) {
        throw new DataError('E.VALIDATION_FAILED', parsed.error.message)
      }
      return parsed.data
    } catch (e) {
      if (e instanceof DataError) throw e
      throw toDataError(e)
    }
  }

  return { supabase: client, request, setRequestDecorator }
}


