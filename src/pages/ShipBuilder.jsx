import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BuilderHeader from "@/components/builder/BuilderHeader";
import HullSelector from "@/components/builder/HullSelector";
import ComponentPalette from "@/components/builder/ComponentPalette";
import BuildGrid from "@/components/builder/BuildGrid";
import StatsPanel from "@/components/builder/StatsPanel";
import SaveBlueprintDialog from "@/components/builder/SaveBlueprintDialog";
import BuildImpactOverlay from "@/components/builder/BuildImpactOverlay";
import { computeStats } from "@/lib/shipStats";
import { checkBuild } from "@/lib/buildLimits";
import BuildWarnings from "@/components/builder/BuildWarnings";

export default function ShipBuilder() {
  const navigate = useNavigate();
  const [hull, setHull] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedName, setLoadedName] = useState(null);
  const [loadedId, setLoadedId] = useState(null);

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
      setLoadedId(bp.id);
    });
  }, [hulls, components]);

  const stats = useMemo(() => computeStats(hull, placements), [hull, placements]);
  const { warnings, faultyKeys } = useMemo(() => checkBuild(hull, placements, stats), [hull, placements, stats]);

  const selectHull = (h) => {
    setHull(h);
    setPlacements([]);
    setLoadedName(null);
    setLoadedId(null);
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
    const payload = {
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
    };
    let bpId = loadedId;
    if (loadedId) {
      await base44.entities.Blueprint.update(loadedId, payload);
    } else {
      const bp = await base44.entities.Blueprint.create(payload);
      bpId = bp.id;
    }
    const prior = await base44.entities.BlueprintVersion.filter({ blueprint_id: bpId }, "-version", 1);
    await base44.entities.BlueprintVersion.create({
      blueprint_id: bpId,
      version: prior.length ? (prior[0].version || 0) + 1 : 1,
      name: meta.name,
      hull_id: hull.id,
      hull_name: hull.name,
      placements: payload.placements,
      stats,
    });
    setSaving(false);
    setSaveOpen(false);
    toast.success(loadedId ? "Blueprint revision saved" : "Blueprint registered", { description: meta.name });
    navigate(`/blueprints/${bpId}`);
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-[1400px] mx-auto w-full">
      <BuilderHeader
        hull={hull}
        loadedName={loadedName}
        placements={placements}
        stats={stats}
        onClear={() => setPlacements([])}
        onSave={() => setSaveOpen(true)}
      />

      <div className="flex-1 grid grid-cols-[250px_1fr_280px] gap-4 min-h-0">
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
        <div className="schematic-panel bp-grid p-4 min-h-0 overflow-auto flex items-start justify-center relative">
          <BuildGrid hull={hull} placements={placements} faultyKeys={faultyKeys} selectedComponent={selectedComponent} onPlace={place} onRemove={remove} />
          {hull && <BuildImpactOverlay hull={hull} placements={placements} selectedComponent={selectedComponent} />}
        </div>

        {/* Right: stats */}
        <div className="schematic-panel p-3 min-h-0 overflow-y-auto">
          <div className="tech-label mb-2">Live Telemetry</div>
          <StatsPanel stats={stats} />
          {hull && (
            <div className="mt-3">
              <div className="tech-label mb-2">Integrity Check</div>
              <BuildWarnings warnings={warnings} onRemove={remove} />
            </div>
          )}
        </div>
      </div>

      {saveOpen && (
        <SaveBlueprintDialog open={saveOpen} onOpenChange={setSaveOpen} onSave={save} saving={saving} defaults={{ name: loadedName || "" }} />
      )}
    </div>
  );
}