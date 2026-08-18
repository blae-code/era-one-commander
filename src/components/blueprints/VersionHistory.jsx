import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { History, RotateCcw, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";
import VersionCompare from "@/components/blueprints/VersionCompare";

const fmt = (n) => (n == null ? "—" : Math.round(n * 10) / 10);

function StatDelta({ label, curr, prev }) {
  const d = curr != null && prev != null ? curr - prev : null;
  return (
    <span className="font-mono text-[10px] text-muted-foreground">
      {label} {fmt(curr)}
      {d != null && d !== 0 && (
        <span className={d > 0 ? "text-[#3ddc6a]" : "text-[#ff2d55]"}> {d > 0 ? "▲" : "▼"}{fmt(Math.abs(d))}</span>
      )}
    </span>
  );
}

export default function VersionHistory({ blueprint }) {
  const qc = useQueryClient();
  const [reverting, setReverting] = useState(null);
  const [compareIds, setCompareIds] = useState([]);

  const toggleCompare = (id) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev.slice(-1), id]
    );

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["blueprintVersions", blueprint.id],
    queryFn: () => base44.entities.BlueprintVersion.filter({ blueprint_id: blueprint.id }, "-version", 50),
  });

  const latest = versions[0]?.version || 0;

  const revert = async (v) => {
    setReverting(v.id);
    await base44.entities.Blueprint.update(blueprint.id, {
      placements: v.placements || [],
      stats: v.stats || {},
      hull_id: v.hull_id || blueprint.hull_id,
      hull_name: v.hull_name || blueprint.hull_name,
    });
    await base44.entities.BlueprintVersion.create({
      blueprint_id: blueprint.id,
      version: latest + 1,
      name: blueprint.name,
      note: `Reverted to v${v.version}`,
      hull_id: v.hull_id || blueprint.hull_id,
      hull_name: v.hull_name || blueprint.hull_name,
      placements: v.placements || [],
      stats: v.stats || {},
    });
    setReverting(null);
    toast.success(`Reverted to v${v.version}`, { description: blueprint.name });
    qc.invalidateQueries({ queryKey: ["blueprint", blueprint.id] });
    qc.invalidateQueries({ queryKey: ["blueprintVersions", blueprint.id] });
  };

  return (
    <div className="schematic-panel p-4">
      <div className="tech-label mb-3 flex items-center gap-1.5">
        <History size={12} /> Version History // {versions.length} revisions
        {versions.length > 1 && (
          <span className="ml-auto normal-case tracking-normal opacity-70">
            {compareIds.length < 2 ? `Select ${2 - compareIds.length} more to compare` : "Comparing"}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="tech-label py-4 animate-pulse">Loading revision log...</div>
      ) : versions.length === 0 ? (
        <div className="tech-label py-4 opacity-70">
          No revisions logged yet — save this design from the Ship Builder to start tracking versions.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {versions.map((v, i) => {
            const prev = versions[i + 1];
            const isCurrent = i === 0;
            return (
              <div key={v.id} className={`border px-3 py-2 flex items-center gap-3 ${compareIds.includes(v.id) ? "border-[#2f9bff] bg-[#2f9bff]/10" : isCurrent ? "border-primary/60 bg-primary/5" : "border-border bg-secondary/40"}`}>
                <div className={`font-mono text-xs font-bold shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                  v{v.version}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(v.created_date).toLocaleString()}
                    </span>
                    {isCurrent && <span className="tech-label text-primary">current</span>}
                    {v.note && <span className="font-mono text-[10px] text-[#ffd21a]">{v.note}</span>}
                  </div>
                  <div className="flex gap-3 flex-wrap mt-0.5">
                    <StatDelta label="DPS" curr={v.stats?.dps} prev={prev?.stats?.dps} />
                    <StatDelta label="HP" curr={v.stats?.hp} prev={prev?.stats?.hp} />
                    <StatDelta label="MASS" curr={v.stats?.mass} prev={prev?.stats?.mass} />
                    <span className="font-mono text-[10px] text-muted-foreground">MODS {(v.placements || []).length}</span>
                  </div>
                </div>
                {versions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-none font-mono text-[10px] shrink-0 ${compareIds.includes(v.id) ? "border-[#2f9bff] text-[#2f9bff]" : ""}`}
                    onClick={() => toggleCompare(v.id)}
                  >
                    <GitCompareArrows size={11} className="mr-1" />
                    {compareIds.includes(v.id) ? "Selected" : "Compare"}
                  </Button>
                )}
                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none font-mono text-[10px] shrink-0"
                    disabled={reverting !== null}
                    onClick={() => revert(v)}
                  >
                    <RotateCcw size={11} className="mr-1" />
                    {reverting === v.id ? "Reverting..." : "Revert"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {compareIds.length === 2 && (() => {
        const pair = versions.filter((v) => compareIds.includes(v.id)).sort((x, y) => (x.version || 0) - (y.version || 0));
        return <VersionCompare a={pair[0]} b={pair[1]} />;
      })()}
    </div>
  );
}