import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Goal, GoalPriority } from "@/lib/types";

const PRIORITY_VARIANT: Record<
  GoalPriority,
  "secondary" | "warning" | "danger"
> = {
  low: "secondary",
  medium: "warning",
  high: "danger",
};

export function GoalCard({ goal }: { goal: Goal }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-100">{goal.title}</h3>
          <Badge variant={PRIORITY_VARIANT[goal.priority]}>
            {goal.priority}
          </Badge>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">{goal.description}</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono">{goal.owner}</span>
          <span className="font-mono">{goal.progress}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
