import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Persona, PersonaStatus } from "@/lib/types";

const STATUS_DOT: Record<PersonaStatus, string> = {
  active: "bg-emerald-500",
  idle: "bg-amber-500",
  offline: "bg-zinc-600",
};

export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-zinc-100">{persona.name}</h3>
            <p className="text-xs text-zinc-500">{persona.title}</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className={cn("size-2 rounded-full", STATUS_DOT[persona.status])}
            />
            {persona.status}
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-400">{persona.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline">{persona.domain}</Badge>
          <span className="font-mono text-xs text-zinc-500">
            {persona.sessions} sessions
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-zinc-600">{persona.model}</p>
      </CardContent>
    </Card>
  );
}
