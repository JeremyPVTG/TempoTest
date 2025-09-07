import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageDriver } from "@habituals/data/offlineQueue/storage/asyncStorageDriver";
import { createQueue } from "@habituals/data/offlineQueue/queue";
import { makeHabitsRepo } from "@habituals/data";
import { dataClient } from "./supabase";

const repo = makeHabitsRepo({ request: dataClient.request });
export const queue = createQueue(new AsyncStorageDriver(AsyncStorage) as any, repo);