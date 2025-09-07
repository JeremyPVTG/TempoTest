import * as React from "react"
import { toastSubscribe } from "@habituals/data/events/toastBus"

interface ToastItem {
  id: string
  title: string
  subtitle?: string
}

export function ToastHost() {
  const [items, setItems] = React.useState<ToastItem[]>([])
  
  React.useEffect(() => {
    return toastSubscribe((p) => {
      const id = crypto.randomUUID?.() ?? String(Date.now())
      setItems((xs) => [...xs, { id, title: p.title, subtitle: p.subtitle }])
      setTimeout(() => setItems((xs) => xs.filter(x => x.id !== id)), 4000)
    })
  }, [])

  return (
    <div style={{position: "fixed", top: 12, right: 12, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8}}>
      {items.map(it => (
        <div key={it.id} style={{padding: "10px 12px", borderRadius: 10, background: "black", color: "white", boxShadow: "0 6px 20px rgba(0,0,0,.35)"}}>
          <div style={{fontWeight: 600}}>{it.title}</div>
          {it.subtitle && <div style={{opacity: .8, fontSize: 12}}>{it.subtitle}</div>}
        </div>
      ))}
    </div>
  )
}