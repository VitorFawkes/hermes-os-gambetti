"use client";

import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ActiveModelCard() {
  const { data } = useQuery({ queryKey: ["config"], queryFn: api.config });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="size-4 text-emerald-500" /> Active Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-lg text-zinc-100">{data?.model ?? "—"}</p>
        <div className="mt-2">
          <Badge variant="outline">{data?.provider ?? "unknown"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
