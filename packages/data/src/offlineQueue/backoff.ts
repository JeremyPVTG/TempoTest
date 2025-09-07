export function nextDelayMs(attempt: number, base = 500, max = 10_000) {
  const exp = Math.min(max, Math.floor(base * 2 ** attempt))
  const jitter = Math.floor(Math.random() * 300)
  return Math.min(max, exp + jitter)
}


