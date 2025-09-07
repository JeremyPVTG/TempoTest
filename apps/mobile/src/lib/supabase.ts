import { createSupabaseClient } from "@habituals/data";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const dataClient = createSupabaseClient({ url, anonKey });

dataClient.setRequestDecorator?.((headers) => ({
  ...headers,
  "x-request-id": ("randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())),
  "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
}));