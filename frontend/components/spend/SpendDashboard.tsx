"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Zap, BarChart3 } from "lucide-react";
import type { CostPoint } from "@/lib/types";
import { formatCost } from "@/lib/utils";
import { CostChart } from "@/components/spend/CostChart";

interface ModelBreakdown {
  model: string;
  sessions: number;
  input_tok: number;
  output_tok: number;
  cost: number;
  calculated_cost?: number;
}

interface DailyCost {
  date: string;
  sessions: number;
  cost: number;
  tokens: number;
}

interface CostComparison {
  opus_cost_per_1m_total: number;
  deepseek_cost_per_1m_total: number;
  savings_pct: number;
  savings_x: string;
}

export function SpendDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [modelBreakdown, setModelBreakdown] = useState<ModelBreakdown[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [comparison, setComparison] = useState<CostComparison | null>(null);
  const [routingModes, setRoutingModes] = useState<any[]>([]);
  const [pricingSource, setPricingSource] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [costsRes, routingRes] = await Promise.all([
        fetch("/api/openrouter/costs"),
        fetch("/api/openrouter/routing"),
      ]);
      const costs = await costsRes.json();
      const routing = await routingRes.json();

      setTotalCost(costs.total_cost || 0);
      setModelBreakdown(costs.model_breakdown || []);
      setDailyCosts(costs.daily_costs || []);
      setComparison(costs.cost_comparison);
      setPricingSource(costs.pricing_source || "cached");
      setRoutingModes(routing.routing_modes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function formatTokens(n: number): string {
    if (!n) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  function shortModelName(full: string): string {
    return full?.split("/").pop() || full || "unknown";
  }

  return (
    <div className="space-y-4">
      {/* Total Cost Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-zinc-800 bg-zinc-900 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100 font-mono">
              ${totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Across {modelBreakdown.length} models · {dailyCosts.length} days tracked
            </p>
            {pricingSource && (
              <Badge variant="secondary" className="mt-2 text-[10px]">
                Pricing: {pricingSource}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Cost Comparison */}
        {comparison && (
          <Card className="border-zinc-800 bg-zinc-900 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                Cost Comparison: Opus vs DeepSeek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Claude Opus 4.7</div>
                  <div className="text-xl font-bold text-zinc-300 font-mono">
                    ${comparison.opus_cost_per_1m_total}
                    <span className="text-xs text-zinc-500 font-normal">/1M tokens</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">DeepSeek V4 Pro</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    ${comparison.deepseek_cost_per_1m_total}
                    <span className="text-xs text-zinc-500 font-normal">/1M tokens</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-emerald-400">{comparison.savings_pct}%</div>
                  <div className="text-xs text-zinc-500">cheaper</div>
                  <div className="text-xs text-emerald-500/70 mt-0.5">{comparison.savings_x}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cost Chart */}
      {dailyCosts.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Daily Cost Trend
            </CardTitle>
            <CardDescription>Last {dailyCosts.length} days with activity</CardDescription>
          </CardHeader>
          <CardContent>
            <CostChart
              data={dailyCosts.map((d) => ({
                date: d.date,
                cost_usd: d.cost || 0,
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Model Breakdown */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Per-Model Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="text-left py-2 font-medium">Model</th>
                  <th className="text-right py-2 font-medium">Sessions</th>
                  <th className="text-right py-2 font-medium">Input</th>
                  <th className="text-right py-2 font-medium">Output</th>
                  <th className="text-right py-2 font-medium">Cost</th>
                  <th className="text-right py-2 font-medium">Calculated</th>
                </tr>
              </thead>
              <tbody>
                {modelBreakdown.map((m, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 text-zinc-200 font-medium">
                      {shortModelName(m.model)}
                      <div className="text-[10px] text-zinc-600 font-mono">{m.model}</div>
                    </td>
                    <td className="py-2.5 text-right text-zinc-300 font-mono">{m.sessions}</td>
                    <td className="py-2.5 text-right text-zinc-400 font-mono">{formatTokens(m.input_tok)}</td>
                    <td className="py-2.5 text-right text-zinc-400 font-mono">{formatTokens(m.output_tok)}</td>
                    <td className="py-2.5 text-right text-zinc-200 font-mono">${(m.cost || 0).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono">
                      {m.calculated_cost ? (
                        <span className={`${m.calculated_cost < (m.cost || 0) ? "text-emerald-400" : "text-red-400"}`}>
                          ${m.calculated_cost.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Routing Modes */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">OpenRouter Routing Modes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {routingModes.slice(0, 4).map((mode: any, i: number) => (
              <div key={i} className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="text-[10px] font-mono">{mode.suffix}</Badge>
                  <span className="text-sm text-zinc-200 font-medium">{mode.name}</span>
                </div>
                <p className="text-xs text-zinc-500">{mode.description}</p>
                <p className="text-[10px] text-zinc-600 mt-1 font-mono">{mode.example}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}