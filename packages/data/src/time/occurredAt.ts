export function occurredAt(tz = Intl.DateTimeFormat().resolvedOptions().timeZone, at: string | Date = new Date()) {
  return { 
    tz, 
    at: (typeof at === "string" ? at : at.toISOString()) 
  }
}