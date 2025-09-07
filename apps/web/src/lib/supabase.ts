import { createSupabaseClient } from "@habituals/data"

export const dataClient = createSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
})

dataClient.setRequestDecorator((h) => ({
  ...h,
  "x-request-id": (crypto as any).randomUUID?.() ?? String(Date.now()),
  "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
}))
