import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wrench, Heart, Trash2 } from "lucide-react";
import { CategoryIcon, HullIcon } from "@/components/icons/EraIcons";
import StatsPanel from "@/components/builder/StatsPanel";
import { toast } from "sonner";

const CELL = 40;
const CAT_BG = {
  weapon: "bg-red-500/10 border-red-500/60",
  engine: "bg-amber-500/10 border-amber-500/60",
  reactor: "bg-emerald-500/10 border-emerald-500/60",
  shield: "bg-cyan-500/10 border-cyan-500/60",
  module: "bg-violet-500/10 border-violet-500/60",
};

export default function BlueprintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: bp, isLoading } = useQuery({ queryKey: ["blueprint", id], queryFn: () => base44.entities.Blueprint.get(id) });
  const { data: hull } = useQuery({
    queryKey: ["hull", bp?.hull_id],
    queryFn: () => base44.entities.Hull.get(bp.hull_id),
    enabled: !!bp?.hull_id,
  });

  if (isLoading) return <div className="tech-label text-center py-24 animate-pulse">Retrieving blueprint...</div>;
  if (!bp) return <div className="tech-label text-center py-24">Blueprint not found</div>;

  const W = hull?.grid_width || 8;
  const H = hull?.grid_height || 6;

  const like = async () => {
    await base44.entities.Blueprint.update(bp.id, { likes: (bp.likes || 0) + 1 });
    qc.invalidateQueries({ queryKey: ["blueprint", id] });
  };

  const del = async () => {
    await base44.entities.Blueprint.delete(bp.id);
    toast.success("Blueprint decommissioned");
    navigate("/blueprints");
  };

  return (
    <div className="p-6 max-w-[1300px] mx-auto">
      <Link to="/blueprints" className="inline-flex items-center gap-1.5 tech-label hover:text-primary transition-colors mb-4">
        <ArrowLeft size={12} /> Blueprint Database
      </Link>

      <div className="schematic-panel p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <HullIcon size={40} className="text-primary" />
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wide leading-none">{bp.name}</h1>
            <div className="tech-label mt-1.5">
              {bp.hull_name} · {bp.ship_class}{bp.role ? ` · ${bp.role}` : ""}{bp.author_name ? ` · ENG ${bp.author_name}` : ""}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-none font-mono text-xs" onClick={like}>
            <Heart size={13} className="mr-1.5" /> {bp.likes || 0}
          </Button>
          <Button variant="outline" className="rounded-none text-red-600 hover:text-red-700" onClick={del}>
            <Trash2 size={13} />
          </Button>
          <Button className="rounded-none font-display uppercase tracking-wider" asChild>
            <Link to={`/builder?blueprint=${bp.id}`}>
              <Wrench size={14} className="mr-1.5" /> Open in Builder
            </Link>
          </Button>
        </div>
      </div>

      {bp.description && (
        <div className="schematic-panel p-4 mb-5">
          <div className="tech-label mb-1.5">Engineer Notes</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{bp.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Schematic view */}
        <div className="schematic-panel p-5 flex items-center justify-center overflow-auto">
          {hull ? (
            <div className="relative" style={{ width: W * CELL, height: H * CELL }}>
              {Array.from({ length: W * H }).map((_, i) => (
                <div
                  key={i}
                  className="absolute border border-primary/15"
                  style={{ left: (i % W) * CELL, top: Math.floor(i / W) * CELL, width: CELL, height: CELL }}
                />
              ))}
              {(bp.placements || []).map((p, i) => (
                <div
                  key={i}
                  title={p.name}
                  className={`absolute flex flex-col items-center justify-center gap-0.5 border-2 ${CAT_BG[p.category] || "bg-secondary border-border"}`}
                  style={{ left: p.x * CELL + 2, top: p.y * CELL + 2, width: (p.w || 1) * CELL - 4, height: (p.h || 1) * CELL - 4 }}
                >
                  <CategoryIcon category={p.category} size={14} />
                  <span className="font-mono text-[7px] leading-none text-foreground/70 truncate max-w-full px-0.5">{p.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tech-label py-12">Hull frame data unavailable</div>
          )}
        </div>

        {/* Stats */}
        <div>
          <div className="tech-label mb-2">Performance Profile</div>
          <StatsPanel stats={bp.stats || {}} />
          <div className="schematic-panel p-3 mt-3">
            <div className="tech-label mb-2">Manifest // {(bp.placements || []).length} modules</div>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {(bp.placements || []).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                  <CategoryIcon category={p.category} size={12} />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-muted-foreground text-[10px]">[{p.x},{p.y}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}