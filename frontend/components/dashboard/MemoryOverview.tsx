"use client";

import { useQuery } from "@tanstack/react-query";
import { Brain } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function countEntries(md: string): number {
  return md.split("\n").filter((line) => line.trim().startsWith("- ")).length;
}

export function MemoryOverview() {
  const { data } = useQuery({ queryKey: ["memory"], queryFn: api.memory });
  const memory = data?.memory_md ?? "";
  const user = data?.user_md ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-4 text-emerald-500" /> Memory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-6">
          <div>
            <p className="font-mono text-xl text-zinc-100">
              {countEntries(memory)}
            </p>
            <p className="text-xs text-zinc-500">MEMORY.md entries</p>
          </div>
          <div>
            <p className="font-mono text-xl text-zinc-100">
              {user ? user.trim().split("\n").length : 0}
            </p>
            <p className="text-xs text-zinc-500">USER.md lines</p>
          </div>
        </div>
        <pre className="max-h-40 overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs whitespace-pre-wrap text-zinc-400">
          {memory.trim() || "No memory recorded yet."}
        </pre>
      </CardContent>
    </Card>
  );
}
