import { createQueue } from "@habituals/data/offlineQueue/queue"
import { WebLocalStorageDriver } from "@habituals/data/offlineQueue/storage"
import { makeHabitsRepo } from "@habituals/data"
import { dataClient } from "./supabase"

const repo = makeHabitsRepo({ request: dataClient.request })
export const queue = createQueue(new WebLocalStorageDriver(), repo)
