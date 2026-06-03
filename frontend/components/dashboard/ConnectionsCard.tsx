"use client";

import { useQuery } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConnectionsCard() {
  const { data } = useQuery({ queryKey: ["config"], queryFn: api.config });
  const platforms = data?.platforms ?? [];
  const toolsets = data?.toolsets ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="size-4 text-emerald-500" /> Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {platforms.length === 0 && (
            <p className="text-xs text-zinc-500">No platforms configured.</p>
          )}
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-300">{p.name}</span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    p.status === "connected" ? "bg-emerald-500" : "bg-zinc-600"
                  )}
                />
                {p.status}
              </span>
            </div>
          ))}
        </div>
        {toolsets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-zinc-800 pt-4">
            {toolsets.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
