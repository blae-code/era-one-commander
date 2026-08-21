import React from "react";
import { X } from "lucide-react";
import { fmtNum } from "@/lib/gameData";

const Chip = ({ children, onRemove, color = "border-primary/50 text-primary" }) => (
  <span className={`inline-flex items-center gap-1 pl-2 pr-1 h-6 border bg-card font-mono text-[10px] ${color}`}>
    {children}
    <button onClick={onRemove} className="hover:text-foreground p-0.5"><X size={10} /></button>
  </span>
);

// Row of removable chips for every active query token, facet, range and toggle.
// wipCount = rows in the current kind the game flags work_in_progress (hidden by default).
export default function ActiveChips({ db, kind, parsed, wipCount = 0 }) {
  const chips = [];
  const rebuild = (words, clauses) =>
    [...words, ...clauses.map(({ field, op, val }) => `${field}${op}${/\s/.test(val) ? `"${val}"` : val}`)].join(" ");
  parsed.words.forEach((w, i) =>
    chips.push({ label: `“${w}”`, on: () => db.setQuery(rebuild(parsed.words.filter((_, j) => j !== i), parsed.clauses)) }));
  parsed.clauses.forEach((c, i) =>
    chips.push({ label: `${c.field}${c.op}${c.val}`, on: () => db.setQuery(rebuild(parsed.words, parsed.clauses.filter((_, j) => j !== i))) }));
  for (const [key, label] of kind.facets)
    for (const v of db.facetSel[key] || [])
      chips.push({ label: `${label}: ${v}`, on: () => db.toggleFacet(key, v), color: "border-[#2f9bff]/50 text-[#2f9bff]" });
  for (const [key, [lo, hi]] of Object.entries(db.ranges)) {
    const col = kind.columns.find((c) => c.key === key);
    chips.push({ label: `${col?.label || key}: ${lo != null ? fmtNum(lo, 0) : "…"} – ${hi != null ? fmtNum(hi, 0) : "…"}`, on: () => db.setRange(key, null, null), color: "border-[#ffd21a]/50 text-[#ffd21a]" });
  }
  if (db.favOnly) chips.push({ label: "★ favourites", on: () => db.setFavOnly(false), color: "border-[#ffd21a]/50 text-[#ffd21a]" });
  // WIP rows are filtered out by default — surface that hidden state and make it dismissable.
  if (db.hideWip && wipCount > 0)
    chips.push({ label: `${wipCount} WIP hidden`, on: () => db.setHideWip(false), color: "border-muted-foreground/40 text-muted-foreground" });
  if (!db.hideWip)
    chips.push({ label: "showing WIP", on: () => db.setHideWip(true), color: "border-[#ffd21a]/50 text-[#ffd21a]" });
  if (!chips.length) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3 -mt-1">
      <span className="tech-label">active</span>
      {chips.map((c, i) => <Chip key={c.label + i} onRemove={c.on} color={c.color}>{c.label}</Chip>)}
      <button onClick={db.clearAll} className="font-mono text-[10px] text-muted-foreground hover:text-destructive uppercase ml-1">clear all</button>
    </div>
  );
}