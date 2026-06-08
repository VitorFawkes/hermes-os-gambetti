"use client";

import { useState, useEffect, useCallback } from "react";
import { GoalCard } from "./GoalCard";
import type { Goal, GoalStatus } from "@/lib/types";

const COLUMNS: { key: GoalStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load goals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addGoal = async () => {
    if (!title.trim()) return;
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, status: "backlog" }),
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAdding(false);
      load();
    } catch (e) {
      console.error("Failed to add goal:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Goals</h2>
          <p className="text-sm text-zinc-500">
            What you&apos;re tracking with Hermes · {goals.length} goal{goals.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {adding ? "Cancel" : "+ New goal"}
        </button>
      </div>

      {adding && (
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal title"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <button
              onClick={addGoal}
              disabled={!title.trim()}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Add goal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = goals.filter((g) => g.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">{col.label}</h3>
                <span className="font-mono text-xs text-zinc-600">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-600">
                    {loading ? "Loading…" : "—"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && goals.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
          No goals tracked yet. Click <span className="text-emerald-400">+ New goal</span> to add your first one — this is real,
          persisted state (no more sample data).
        </p>
      )}
    </div>
  );
}
