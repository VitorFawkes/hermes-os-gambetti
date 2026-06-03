"use client";

import { GoalCard } from "./GoalCard";
import type { Goal, GoalStatus } from "@/lib/types";

const COLUMNS: { key: GoalStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

// Goals have no backend table yet — illustrative scaffold data.
const GOALS: Goal[] = [
  {
    id: "g1",
    title: "Voice interface",
    description: "Talk to Hermes over a low-latency voice channel.",
    status: "backlog",
    priority: "low",
    progress: 0,
    owner: "apollo",
  },
  {
    id: "g2",
    title: "Self-healing cron",
    description: "Auto-retry and alert on failed scheduled jobs.",
    status: "backlog",
    priority: "medium",
    progress: 10,
    owner: "hypnos",
  },
  {
    id: "g3",
    title: "Unified memory index",
    description: "Single searchable index across MEMORY.md and USER.md.",
    status: "in_progress",
    priority: "high",
    progress: 60,
    owner: "hestia",
  },
  {
    id: "g4",
    title: "Cost guardrails",
    description: "Hard budget caps per platform with live enforcement.",
    status: "in_progress",
    priority: "medium",
    progress: 45,
    owner: "athena",
  },
  {
    id: "g5",
    title: "Multi-tenant gateway",
    description: "Isolated toolsets and keys per workspace.",
    status: "blocked",
    priority: "high",
    progress: 30,
    owner: "hermes",
  },
  {
    id: "g6",
    title: "Dashboard v1",
    description: "Read-only control panel over Hermes state.",
    status: "done",
    priority: "high",
    progress: 100,
    owner: "hephaestus",
  },
  {
    id: "g7",
    title: "Session telemetry",
    description: "Per-session token and cost accounting in state.db.",
    status: "done",
    priority: "medium",
    progress: 100,
    owner: "hermes",
  },
];

export function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Goals</h2>
        <p className="text-sm text-zinc-500">What Hermes is working toward.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = GOALS.filter((g) => g.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  {col.label}
                </h3>
                <span className="font-mono text-xs text-zinc-600">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-600">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
