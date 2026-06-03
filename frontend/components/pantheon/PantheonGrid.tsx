"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Plus, RefreshCw, Trash2, Upload, Edit3 } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  job_description: string;
  model: string;
  system_prompt: string;
  triad_config?: {
    conductor?: string;
    worker?: string;
    critic?: string;
  };
  created_at: string;
  synced: boolean;
  sync_path?: string;
}

interface Model {
  id: string;
  name: string;
  role: string;
  cost_per_1m: number;
}

interface TriadTemplate {
  conductor: { template: string; recommended_models: string[] };
  worker: { template: string; recommended_models: string[] };
  critic: { template: string; recommended_models: string[] };
  flow_diagram: string;
}

export function PantheonGrid() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [triadTemplate, setTriadTemplate] = useState<TriadTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formJob, setFormJob] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formConductor, setFormConductor] = useState("");
  const [formWorker, setFormWorker] = useState("");
  const [formCritic, setFormCritic] = useState("");
  const [useTriad, setUseTriad] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/pantheon/personas"),
        fetch("/api/pantheon/models"),
      ]);
      const pData = await pRes.json();
      const mData = await mRes.json();
      setPersonas(pData.personas || []);
      setModels(mData.models || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTriadTemplate = async () => {
    try {
      const res = await fetch("/api/pantheon/triad-template");
      const data = await res.json();
      setTriadTemplate(data);
      setFormConductor(data.conductor.template);
      setFormWorker(data.worker.template);
      setFormCritic(data.critic.template);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingPersona(null);
    setFormName("");
    setFormJob("");
    setFormModel("");
    setFormConductor(triadTemplate?.conductor.template || "");
    setFormWorker(triadTemplate?.worker.template || "");
    setFormCritic(triadTemplate?.critic.template || "");
    setUseTriad(false);
    setShowCreate(true);
    fetchTriadTemplate();
  };

  const openEdit = (p: Persona) => {
    setEditingPersona(p);
    setFormName(p.name);
    setFormJob(p.job_description);
    setFormModel(p.model);
    setFormConductor(p.triad_config?.conductor || "");
    setFormWorker(p.triad_config?.worker || "");
    setFormCritic(p.triad_config?.critic || "");
    setUseTriad(!!p.triad_config?.conductor);
    setShowCreate(true);
    fetchTriadTemplate();
  };

  const handleSave = async () => {
    const body = {
      name: formName,
      job_description: formJob,
      model: formModel || "anthropic/claude-opus-4-7",
      system_prompt: "",
      triad_config: useTriad
        ? {
            conductor: formConductor,
            worker: formWorker,
            critic: formCritic,
          }
        : {},
    };

    const url = editingPersona
      ? `/api/pantheon/personas/${editingPersona.id}`
      : "/api/pantheon/personas";
    const method = editingPersona ? "PUT" : "POST";

    try {
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setShowCreate(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/pantheon/personas/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      await fetch(`/api/pantheon/personas/${id}/sync`, { method: "POST" });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncing("__all__");
    try {
      await fetch("/api/pantheon/personas/sync-all", { method: "POST" });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Pantheon
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {personas.length} persona{personas.length !== 1 ? "s" : ""} ·{" "}
            {personas.filter((p) => p.synced).length} synced to Hermes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {personas.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncing === "__all__"}
              className="text-zinc-400 border-zinc-700 hover:text-zinc-200 gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {syncing === "__all__" ? "Syncing..." : "Sync All"}
            </Button>
          )}
          <Button size="sm" onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Create Persona
          </Button>
        </div>
      </div>

      {/* Persona Grid */}
      {loading ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-zinc-500">Loading personas...</CardContent>
        </Card>
      ) : personas.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center">
            <Bot className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-medium">No personas yet</p>
            <p className="text-zinc-600 text-xs mt-1">
              Create your first AI agent persona to build your Pantheon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {personas.map((p) => (
            <Card key={p.id} className="border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300"
                      onClick={() => openEdit(p)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{p.job_description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {p.model}
                  </Badge>
                  {p.triad_config?.conductor && (
                    <Badge variant="default" className="text-[10px]">
                      Triad
                    </Badge>
                  )}
                </div>

                {/* Triad roles */}
                {p.triad_config && (p.triad_config.conductor || p.triad_config.worker || p.triad_config.critic) && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-3">
                    {p.triad_config.conductor && <span>🎯 Planner</span>}
                    {p.triad_config.worker && <span>→ 🔧 Worker</span>}
                    {p.triad_config.critic && <span>→ 🔍 Critic</span>}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  {p.synced ? (
                    <Badge variant="default" className="text-[10px] gap-1">
                      ✓ Synced
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Not synced
                    </Badge>
                  )}
                  {!p.synced && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-emerald-400 hover:text-emerald-300 gap-1"
                      onClick={() => handleSync(p.id)}
                      disabled={syncing === p.id}
                    >
                      <RefreshCw className={`w-3 h-3 ${syncing === p.id ? "animate-spin" : ""}`} />
                      {syncing === p.id ? "..." : "Sync"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              {editingPersona ? `Edit ${editingPersona.name}` : "Create Persona"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Configure an AI agent with a specific role, model, and optional Triad pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Name + Job */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Persona Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Orpheus, DeepThinker"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Job Description</label>
                <Input
                  value={formJob}
                  onChange={(e) => setFormJob(e.target.value)}
                  placeholder="e.g. Deeply reasons on any topic using multi-model analysis"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            {/* Model selector */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Orchestrator Model</label>
              <Select value={formModel} onValueChange={setFormModel}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-zinc-200">
                      <span className="flex items-center gap-2">
                        {m.name}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ${m.cost_per_1m}/1M
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Triad toggle */}
            <div className="flex items-center gap-3 py-2">
              <button
                onClick={() => setUseTriad(!useTriad)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  useTriad ? "bg-emerald-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useTriad ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-zinc-300">Triad System</span>
              <span className="text-xs text-zinc-500">Planner → Worker → Critic pipeline</span>
            </div>

            {/* Triad prompts */}
            {useTriad && triadTemplate && (
              <div className="space-y-3 border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
                <p className="text-xs text-zinc-500 font-mono whitespace-pre-wrap">{triadTemplate.flow_diagram}</p>

                {[
                  { label: "🎯 Conductor (Planner)", value: formConductor, setter: setFormConductor, models: triadTemplate.conductor.recommended_models },
                  { label: "🔧 Worker (Executor)", value: formWorker, setter: setFormWorker, models: triadTemplate.worker.recommended_models },
                  { label: "🔍 Critic (Reviewer)", value: formCritic, setter: setFormCritic, models: triadTemplate.critic.recommended_models },
                ].map(({ label, value, setter, models: recModels }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-zinc-400">{label}</label>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {recModels.join(", ")}
                      </span>
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      rows={5}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-xs text-zinc-300 font-mono resize-y focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-zinc-700 text-zinc-400">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName || !formJob}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {editingPersona ? "Save Changes" : "Create Persona"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}