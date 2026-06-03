import { SoulEditor } from "@/components/soul/SoulEditor";

export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-200">Soul.md Editor</h2>
      <p className="text-xs text-zinc-500">
        This is what Hermes reads to understand who you are. Based on Jack Roberts' soul.md template.
      </p>
      <SoulEditor />
    </div>
  );
}