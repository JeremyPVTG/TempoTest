import { makeHabitsRepo, createHabitsQueries, createHabitMutations } from "@habituals/data";
import { dataClient } from "./supabase";
import { queue } from "./queue";

const repo = makeHabitsRepo({ request: dataClient.request });

export const Q = createHabitsQueries(repo);
export const M = createHabitMutations(repo, { 
  enqueue: (operation) => queue.enqueue(operation as any) 
});