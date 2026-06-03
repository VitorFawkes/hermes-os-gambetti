import type {
  Config,
  CostPoint,
  CronOutput,
  Memory,
  ModelStat,
  Session,
  SessionStats,
  SkillDir,
  UsagePoint,
} from "./types";

// Paths are relative; next.config.ts rewrites /api/* to the Hermes backend.
async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => get<{ status: string }>("/api/health"),
  sessions: () => get<Session[]>("/api/sessions/"),
  session: (id: string) => get<Session>(`/api/sessions/${id}`),
  sessionStats: () => get<SessionStats>("/api/sessions/stats"),
  config: () => get<Config>("/api/config/"),
  skills: () => get<SkillDir[]>("/api/skills/"),
  cron: () => get<CronOutput[]>("/api/cron/"),
  memory: () => get<Memory>("/api/memory/"),
  usage: () => get<UsagePoint[]>("/api/stats/usage"),
  models: () => get<ModelStat[]>("/api/stats/models"),
  costs: () => get<CostPoint[]>("/api/stats/costs"),
};
