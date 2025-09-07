type Payload = { kind: "achievement"; title: string; subtitle?: string }
type Listener = (p: Payload) => void

const L = new Set<Listener>()

export function toastEmit(p: Payload) {
  for (const l of Array.from(L)) {
    l(p)
  }
}

export function toastSubscribe(fn: Listener): () => void {
  L.add(fn)
  return () => { L.delete(fn) }
}