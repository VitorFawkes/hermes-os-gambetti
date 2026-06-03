"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X, RefreshCw, Brain } from "lucide-react";

interface Dream {
  id: string;
  category: string;
  icon: string;
  message: string;
  done: boolean;
  created_at: string;
}

interface AnalysisSummary {
  sessions_7d: number;
  unique_models: number;
  total_tokens: number;
  total_cost: number;
}

export function DreamsPanel() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDreams = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/dreams");
      const data = await res.json();
      setDreams(data.dreams || []);
      setAnalysis(data.analysis_summary || null);
    } catch (e) {
      console.error("Failed to load dreams:", e);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchDreams();
  }, []);

  const handleComplete = async (dreamId: string) => {
    try {
      await fetch(`/api/dreams/${dreamId}/complete`, { method: "POST" });
      setDreams((prev) =>
        prev.map((d) => (d.id === dreamId ? { ...d, done: true } : d))
      );
    } catch (e) {
      console.error("Failed to complete dream:", e);
    }
  };

  const handleDismiss = async (dreamId: string) => {
    try {
      await fetch(`/api/dreams/${dreamId}/dismiss`, { method: "POST" });
      setDreams((prev) => prev.filter((d) => d.id !== dreamId));
    } catch (e) {
      console.error("Failed to dismiss dream:", e);
    }
  };

  const pendingDreams = dreams.filter((d) => !d.done);
  const completedDreams = dreams.filter((d) => d.done);

  function formatTokens(n: number): string {
    if (!n || n === 0) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  return (
    <div className="space-y-4">
      {/* Analysis Summary Bar */}
      {analysis && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-3 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500">Last 7 days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-zinc-200 font-semibold">{analysis.sessions_7d}</span>
              <span className="text-zinc-500 text-xs">sessions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-zinc-200 font-semibold">{analysis.unique_models}</span>
              <span className="text-zinc-500 text-xs">models</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-zinc-200 font-semibold">{formatTokens(analysis.total_tokens)}</span>
              <span className="text-zinc-500 text-xs">tokens</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-mono text-emerald-400 font-semibold">
                ${(analysis.total_cost || 0).toFixed(2)}
              </span>
              <span className="text-zinc-500 text-xs">spent</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dream Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading ? (
          <Card className="border-zinc-800 bg-zinc-900 col-span-2">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-pulse" />
              <p className="text-zinc-500 text-sm">Analyzing your sessions...</p>
            </CardContent>
          </Card>
        ) : pendingDreams.length === 0 && completedDreams.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900 col-span-2">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-zinc-300 text-sm font-medium">No dreams yet</p>
              <p className="text-zinc-500 text-xs mt-1">Start chatting with Hermes and dreams will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendingDreams.map((dream) => (
              <Card
                key={dream.id}
                className="border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{dream.icon}</span>
                    <p className="text-sm text-zinc-200 flex-1 leading-relaxed">
                      {dream.message}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                    <Badge variant="secondary" className="text-[10px]">
                      {dream.category.replace("_", " ")}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-900/20"
                        onClick={() => handleComplete(dream.id)}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-900/20"
                        onClick={() => handleDismiss(dream.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Completed dreams (collapsed) */}
            {completedDreams.length > 0 && (
              <Card className="border-zinc-800/50 bg-zinc-900/50 col-span-full">
                <CardContent className="p-3">
                  <details className="text-xs text-zinc-500">
                    <summary className="cursor-pointer hover:text-zinc-400">
                      ✓ {completedDreams.length} completed dream{completedDreams.length > 1 ? "s" : ""}
                    </summary>
                    <div className="mt-2 space-y-1">
                      {completedDreams.map((dream) => (
                        <div key={dream.id} className="text-zinc-600 line-through pl-4">
                          {dream.icon} {dream.message}
                        </div>
                      ))}
                    </div>
                  </details>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Refresh button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchDreams}
          disabled={generating}
          className="text-zinc-500 hover:text-emerald-400 gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Dreaming..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}