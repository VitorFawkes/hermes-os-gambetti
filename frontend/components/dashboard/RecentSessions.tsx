"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCost, formatRelativeTime, formatTokens } from "@/lib/utils";

export function RecentSessions() {
  const { data } = useQuery({ queryKey: ["sessions"], queryFn: api.sessions });
  const sessions = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-emerald-500" /> Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-800">
          {sessions.length === 0 && (
            <p className="px-5 py-4 text-sm text-zinc-500">No sessions yet.</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">
                  {s.title ?? "Untitled session"}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">{s.model}</span>
                  <Badge variant="secondary">{s.source}</Badge>
                  <span>{formatRelativeTime(s.started_at)}</span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm text-zinc-300">
                  {formatCost(s.estimated_cost_usd)}
                </p>
                <p className="font-mono text-xs text-zinc-500">
                  {formatTokens(s.input_tokens + s.output_tokens)} tok
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
