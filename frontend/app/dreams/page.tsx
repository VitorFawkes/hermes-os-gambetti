import { DreamsPanel } from "@/components/dreams/DreamsPanel";

export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
        🌙 Auto-Dreaming
      </h2>
      <p className="text-xs text-zinc-500">
        Proactive suggestions based on your chat history across all models. Dreams run overnight and appear here.
      </p>
      <DreamsPanel />
    </div>
  );
}