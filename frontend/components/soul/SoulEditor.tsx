"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, User, Brain, FileText } from "lucide-react";

interface SoulProps {
  onSaved?: () => void;
}

const SECTION_KEYS = [
  { key: "identity", label: "Identity", icon: "👤" },
  { key: "mission", label: "Mission & Goals", icon: "🎯" },
  { key: "business", label: "Business & Revenue", icon: "💼" },
  { key: "voice", label: "Voice & Communication", icon: "🗣️" },
  { key: "tools", label: "Tools & Stack", icon: "⚙️" },
];

export function SoulEditor({ onSaved }: SoulProps) {
  const [sections, setSections] = useState<Record<string, string>>({});
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<"sections" | "raw">("raw");
  const [stats, setStats] = useState<{ char_count: number; line_count: number } | null>(null);
  const [activeSection, setActiveSection] = useState("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const fetchSoul = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/soul/user");
      const data = await res.json();
      const secs = data.sections || {};
      setSections(secs);
      setRaw(data.raw || "");
      setStats(data.stats);
      // Show whatever actually has content: structured sections if present,
      // otherwise the raw USER.md so real content is never hidden.
      setMode(Object.keys(secs).length > 0 ? "sections" : "raw");
    } catch (e) {
      console.error("Failed to load soul:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoul();
  }, []);

  const handleSaveSections = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/soul/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        onSaved?.();
        fetchSoul();
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRaw = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/soul/user/raw", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: raw }),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        onSaved?.();
        fetchSoul();
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const hasContent = (key: string) => !!sections[key] && sections[key].trim().length > 0;

  const ModeToggle = () => (
    <div className="flex rounded-md border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setMode("sections")}
        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${
          mode === "sections" ? "bg-emerald-900/30 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Brain className="w-3.5 h-3.5" /> Sections
      </button>
      <button
        onClick={() => setMode("raw")}
        className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${
          mode === "raw" ? "bg-emerald-900/30 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <FileText className="w-3.5 h-3.5" /> Raw
      </button>
    </div>
  );

  // RAW MODE — shows the actual USER.md content (never empty when there is data)
  if (mode === "raw") {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" /> USER.md (raw)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              {stats
                ? `${stats.char_count} chars · ${stats.line_count} lines — what Hermes reads to know who you are`
                : "What Hermes reads to understand who you are."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {savedAt && <span className="text-xs text-emerald-400 font-mono">Saved {savedAt}</span>}
            <Button size="sm" onClick={fetchSoul} variant="ghost" className="text-zinc-400 hover:text-zinc-200">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRaw}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={loading ? "Loading..." : "Your USER.md — Hermes reads this to understand who you are."}
            className="w-full h-[28rem] bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-200 font-mono resize-y focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-zinc-600"
            spellCheck={false}
          />
        </CardContent>
      </Card>
    );
  }

  // SECTIONS MODE — structured editor
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card className="lg:col-span-1 border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" /> Soul Sections
          </CardTitle>
          {stats && (
            <CardDescription className="text-xs font-mono text-zinc-500">
              {stats.char_count} chars · {stats.line_count} lines
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
          {SECTION_KEYS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                activeSection === key
                  ? "bg-emerald-900/20 text-emerald-400 border border-emerald-900/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span>{icon}</span>
              <span className="flex-1">{label}</span>
              {hasContent(key) && (
                <Badge variant="default" className="text-[10px] h-4 px-1.5">
                  ✓
                </Badge>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              {SECTION_KEYS.find((s) => s.key === activeSection)?.icon}{" "}
              {SECTION_KEYS.find((s) => s.key === activeSection)?.label}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              {activeSection === "identity" && "Who you are — name, role, languages, context Hermes needs"}
              {activeSection === "mission" && "Your goals — yearly targets, quarterly objectives, north star"}
              {activeSection === "business" && "Business context — revenue, runway, key metrics Hermes tracks"}
              {activeSection === "voice" && "How Hermes should talk to you — tone, style, pet peeves"}
              {activeSection === "tools" && "Your stack — preferred models, platforms, integrations"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {savedAt && <span className="text-xs text-emerald-400 font-mono">Saved {savedAt}</span>}
            <Button size="sm" onClick={fetchSoul} variant="ghost" className="text-zinc-400 hover:text-zinc-200">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSections}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={sections[activeSection] || ""}
            onChange={(e) => setSections((prev) => ({ ...prev, [activeSection]: e.target.value }))}
            placeholder={`Write your ${activeSection} section...\n\nThis becomes part of your soul.md — Hermes reads this to understand who you are.`}
            className="w-full h-64 bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-200 font-mono resize-y focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-zinc-600"
            spellCheck={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
