import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import HullSelector from "@/components/builder/HullSelector";
import ComponentPalette from "@/components/builder/ComponentPalette";
import BuildGrid from "@/components/builder/BuildGrid";
import StatsPanel from "@/components/builder/StatsPanel";
import SaveBlueprintDialog from "@/components/builder/SaveBlueprintDialog";
import { computeStats } from "@/lib/shipStats";

export default function ShipBuilder() {
  const navigate = useNavigate();
  const [hull, setHull] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedName, setLoadedName] = useState(null);

  const { data: hulls = [] } = useQuery({ queryKey: ["hulls"], queryFn: () => base44.entities.Hull.list("-created_date", 100) });
  const { data: components = [] } = useQuery({ queryKey: ["components"], queryFn: () => base44.entities.Component.list("-created_date", 500) });

  // Import blueprint via ?blueprint=<id>
  useEffect(() => {
    const bpId = new URLSearchParams(window.location.search).get("blueprint");
    if (!bpId || hulls.length === 0 || components.length === 0) return;
    base44.entities.Blueprint.get(bpId).then((bp) => {
      const h = hulls.find((x) => x.id === bp.hull_id);
      if (h) setHull(h);
      const byId = Object.fromEntries(components.map((c) => [c.id, c]));
      setPlacements(
        (bp.placements || [])
          .filter((p) => byId[p.component_id])
          .map((p, i) => ({ key: `${p.component_id}-${i}-${Date.now()}`, component: byId[p.component_id], x: p.x, y: p.y, w: p.w, h: p.h }))
      );
      setLoadedName(bp.name);
    });
  }, [hulls, components]);

  const stats = useMemo(() => computeStats(hull, placements), [hull, placements]);

  const selectHull = (h) => {
    setHull(h);
    setPlacements([]);
    setLoadedName(null);
  };

  const place = (comp, x, y) => {
    setPlacements((prev) => [
      ...prev,
      { key: `${comp.id}-${Date.now()}`, component: comp, x, y, w: comp.grid_w || 1, h: comp.grid_h || 1 },
    ]);
  };

  const remove = (key) => setPlacements((prev) => prev.filter((p) => p.key !== key));

  const save = async (meta) => {
    setSaving(true);
    const bp = await base44.entities.Blueprint.create({
      ...meta,
      hull_id: hull.id,
      hull_name: hull.name,
      ship_class: hull.ship_class,
      placements: placements.map((p) => ({
        component_id: p.component.id,
        name: p.component.name,
        category: p.component.category,
        x: p.x, y: p.y, w: p.w, h: p.h,
      })),
      stats,
    });
    setSaving(false);
    setSaveOpen(false);
    toast.success("Blueprint registered", { description: meta.name });
    navigate(`/blueprints/${bp.id}`);
  };

  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-xl tracking-[0.15em] uppercase">Ship Builder</h1>
          <p className="tech-label mt-0.5">
            {loadedName ? `Loaded // ${loadedName}` : hull ? `Frame // ${hull.name}` : "Select a hull frame to begin"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-none font-display uppercase tracking-wider" disabled={placements.length === 0} onClick={() => setPlacements([])}>
            <Trash2 size={14} className="mr-1.5" /> Clear
          </Button>
          <Button className="rounded-none font-display uppercase tracking-wider" disabled={!hull || placements.length === 0} onClick={() => setSaveOpen(true)}>
            <Save size={14} className="mr-1.5" /> Save Blueprint
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[240px_1fr_260px] gap-4 min-h-0">
        {/* Left: hull + palette */}
        <div className="flex flex-col min-h-0 gap-3">
          <div className="schematic-panel p-3 overflow-y-auto max-h-[38%]">
            <div className="tech-label mb-2">Hull Frames</div>
            <HullSelector hulls={hulls} selectedId={hull?.id} onSelect={selectHull} />
          </div>
          <div className="schematic-panel p-3 flex-1 min-h-0 flex flex-col">
            <div className="tech-label mb-2">Component Bay {selectedComponent && <span className="text-accent">// {selectedComponent.name} armed</span>}</div>
            <ComponentPalette components={components} selected={selectedComponent} onSelect={setSelectedComponent} />
          </div>
        </div>

        {/* Center: grid */}
        <div className="overflow-auto flex items-start justify-center pt-4">
          <BuildGrid hull={hull} placements={placements} selectedComponent={selectedComponent} onPlace={place} onRemove={remove} />
        </div>

        {/* Right: stats */}
        <div className="overflow-y-auto">
          <div className="tech-label mb-2">Live Telemetry</div>
          <StatsPanel stats={stats} />
        </div>
      </div>

      {saveOpen && (
        <SaveBlueprintDialog open={saveOpen} onOpenChange={setSaveOpen} onSave={save} saving={saving} defaults={{ name: loadedName ? `${loadedName} (Rev)` : "" }} />
      )}
    </div>
  );
}