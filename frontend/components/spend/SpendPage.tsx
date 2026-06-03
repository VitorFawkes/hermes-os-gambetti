"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostChart } from "./CostChart";
import { formatCost, formatTokens } from "@/lib/utils";

export function SpendPage() {
  const costs = useQuery({ queryKey: ["costs"], queryFn: api.costs });
  const models = useQuery({ queryKey: ["models"], queryFn: api.models });

  const costData = costs.data ?? [];
  const modelData = models.data ?? [];
  const total = costData.reduce((acc, c) => acc + c.cost_usd, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Spend</h2>
        <p className="text-sm text-zinc-500">
          Token usage and cost across Hermes sessions.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Daily Cost</CardTitle>
          <span className="font-mono text-sm text-emerald-400">
            {formatCost(total)} total
          </span>
        </CardHeader>
        <CardContent>
          <CostChart data={costData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Model</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {modelData.length === 0 && (
              <p className="px-5 py-4 text-sm text-zinc-500">
                No model usage yet.
              </p>
            )}
            {modelData.map((m) => (
              <div
                key={m.model}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="font-mono text-sm text-zinc-200">{m.model}</p>
                  <p className="text-xs text-zinc-500">
                    {m.sessions} sessions · {formatTokens(m.tokens)} tokens
                  </p>
                </div>
                <p className="font-mono text-sm text-emerald-400">
                  {formatCost(m.cost_usd)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
