"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Header() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 15_000,
  });
  const online = !!data && !isError;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Agent OS
        </p>
        <h1 className="text-sm font-medium text-zinc-200">Control Panel</h1>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            "size-2 rounded-full",
            online ? "bg-emerald-500" : "bg-red-500"
          )}
        />
        <span className="text-zinc-400">
          {online ? "Backend online" : "Backend offline"}
        </span>
      </div>
    </header>
  );
}
