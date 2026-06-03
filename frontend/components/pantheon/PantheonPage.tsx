"use client";

import { PersonaCard } from "./PersonaCard";
import type { Persona } from "@/lib/types";

// Pantheon has no backend table yet — these personas are illustrative scaffold
// data so the page renders. Wire to a real endpoint when Hermes exposes one.
const PERSONAS: Persona[] = [
  {
    id: "hermes",
    name: "Hermes",
    title: "Orchestrator",
    domain: "coordination",
    status: "active",
    model: "claude-opus-4-8",
    sessions: 142,
    description:
      "Routes work across the pantheon and keeps every agent in sync.",
  },
  {
    id: "athena",
    name: "Athena",
    title: "Strategist",
    domain: "planning",
    status: "active",
    model: "claude-opus-4-8",
    sessions: 87,
    description:
      "Breaks ambitious goals into executable plans and weighs trade-offs.",
  },
  {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Builder",
    domain: "engineering",
    status: "idle",
    model: "claude-sonnet-4-6",
    sessions: 213,
    description: "Writes, refactors and ships code across the full stack.",
  },
  {
    id: "apollo",
    name: "Apollo",
    title: "Researcher",
    domain: "research",
    status: "active",
    model: "claude-sonnet-4-6",
    sessions: 64,
    description: "Runs deep web research and synthesizes cited reports.",
  },
  {
    id: "hestia",
    name: "Hestia",
    title: "Keeper",
    domain: "memory",
    status: "idle",
    model: "claude-haiku-4-5",
    sessions: 38,
    description: "Curates long-term memory and keeps USER.md current.",
  },
  {
    id: "hypnos",
    name: "Hypnos",
    title: "Scheduler",
    domain: "automation",
    status: "offline",
    model: "claude-haiku-4-5",
    sessions: 19,
    description: "Runs cron jobs and overnight batch tasks.",
  },
];

export function PantheonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Pantheon</h2>
        <p className="text-sm text-zinc-500">
          The agents and personas that make up Hermes.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((persona) => (
          <PersonaCard key={persona.id} persona={persona} />
        ))}
      </div>
    </div>
  );
}
