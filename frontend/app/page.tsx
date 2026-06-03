import { ActiveModelCard } from "@/components/dashboard/ActiveModelCard";
import { ConnectionsCard } from "@/components/dashboard/ConnectionsCard";
import { MemoryOverview } from "@/components/dashboard/MemoryOverview";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { StatsGrid } from "@/components/dashboard/StatsGrid";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-500">
          Live overview of the Hermes agent operating system.
        </p>
      </div>
      <StatsGrid />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActiveModelCard />
        <ConnectionsCard />
        <MemoryOverview />
      </div>
      <RecentSessions />
    </div>
  );
}
