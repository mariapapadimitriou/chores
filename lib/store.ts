import { Redis } from "@upstash/redis";
import { State, initialState } from "./types";

const KEY = "chores:state:v1";

// @upstash/redis reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN,
// or KV_REST_API_URL / KV_REST_API_TOKEN — both are auto-injected by Vercel
// depending on which storage integration you attach. Falls back to
// in-memory if neither is present so local dev works out of the box.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

let memory: State | null = null;

export async function getState(): Promise<State> {
  if (redis) {
    const raw = (await redis.get<State>(KEY)) ?? null;
    if (raw) return raw;
    const fresh = initialState();
    await redis.set(KEY, fresh);
    return fresh;
  }
  if (!memory) memory = initialState();
  return memory;
}

export async function setState(next: State): Promise<State> {
  next.updatedAt = Date.now();
  if (redis) {
    await redis.set(KEY, next);
  } else {
    memory = next;
  }
  return next;
}

export async function mutate(fn: (s: State) => void | Promise<void>): Promise<State> {
  const s = await getState();
  await fn(s);
  return setState(s);
}

export function id() {
  return Math.random().toString(36).slice(2, 10);
}
