import React, { useEffect } from "react"
import { useConnectivity } from "@habituals/data/connectivity"
import { queue } from "../lib/queue"

export function SyncBoundary({ children }: { children: React.ReactNode }) {
  const online = useConnectivity()
  useEffect(() => {
    if (online) void queue.drain()
  }, [online])
  return <>{children}</>
}
