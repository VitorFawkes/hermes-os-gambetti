export interface Session {
  id: string;
  model: string;
  source: string;
  started_at: string;
  message_count: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  title: string | null;
}

export interface SessionStats {
  total_sessions: number;
  total_messages: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
}

export interface Platform {
  name: string;
  status: string;
}

export interface Config {
  model: string | null;
  provider: string | null;
  platforms: Platform[];
  toolsets: string[];
}

export interface Memory {
  memory_md: string;
  user_md: string;
}

export interface SkillDir {
  name: string;
  description: string;
  files: number;
}

export interface CronOutput {
  name: string;
  size: number;
  modified_at: string;
  preview: string;
}

export interface UsagePoint {
  date: string;
  input_tokens: number;
  output_tokens: number;
  sessions: number;
}

export interface ModelStat {
  model: string;
  sessions: number;
  tokens: number;
  cost_usd: number;
}

export interface CostPoint {
  date: string;
  cost_usd: number;
}

export type PersonaStatus = "active" | "idle" | "offline";

export interface Persona {
  id: string;
  name: string;
  title: string;
  domain: string;
  status: PersonaStatus;
  model: string;
  sessions: number;
  description: string;
}

export type GoalStatus = "backlog" | "in_progress" | "blocked" | "done";

export type GoalPriority = "low" | "medium" | "high";

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number;
  owner: string;
}
