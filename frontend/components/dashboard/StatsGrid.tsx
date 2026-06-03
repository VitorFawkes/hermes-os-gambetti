"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Cpu, DollarSign, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { formatCost, formatTokens } from "@/lib/utils";

export function StatsGrid() {
  const { data } = useQuery({
    queryKey: ["session-stats"],
    queryFn: api.sessionStats,
  });

  const stats = [
    {
      label: "Sessions",
      value: data ? data.total_sessions.toLocaleString() : "—",
      icon: Activity,
    },
    {
      label: "Messages",
      value: data ? data.total_messages.toLocaleString() : "—",
      icon: MessageSquare,
    },
    {
      label: "Tokens",
      value: data
        ? formatTokens(data.total_input_tokens + data.total_output_tokens)
        : "—",
      icon: Cpu,
    },
    {
      label: "Total Cost",
      value: data ? formatCost(data.total_cost_usd) : "—",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {s.label}
            </span>
            <s.icon className="size-4 text-emerald-500" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold text-zinc-100">
            {s.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
