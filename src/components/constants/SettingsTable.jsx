import React, { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Link2 } from "lucide-react";
import { DEAD_FIELDS, CROSS_REF, FAMILY_RULES, familyOf, fmtVal } from "@/components/constants/constantsLib";

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Search haystack per entry: key + family + rendered value(s).
const haystack = (key, family, value) => {
  const parts = [key, family];
  if (isPlainObject(value)) for (const [k, v] of Object.entries(value)) parts.push(k, fmtVal(v));
  else parts.push(fmtVal(value));
  return parts.join(" ").toLowerCase();
};

const CrossRefBadge = ({ note }) => (
  <span
    title={note}
    className="inline-flex items-center gap-1 border border-primary/50 text-primary font-mono text-[8px] uppercase tracking-[0.15em] px-1 py-[1px] shrink-0"
  >
    <Link2 size={8} /> cross-ref
  </span>
);

const ValueCell = ({ value }) => {
  const text = fmtVal(value);
  const long = typeof value === "string" && text.length > 48;
  return (
    <span
      className={`font-mono text-[11px] ember-glow break-words whitespace-pre-wrap ${long ? "block text-left text-[10px] text-foreground/90 max-w-[520px]" : "text-foreground"}`}
    >
      {text}
    </span>
  );
};

// GameSetting (1 row × 182 columns): transposed key/value reference, grouped by inferred
// prefix families, client-side searchable. The 2 dead columns are omitted.
export default function SettingsTable({ row }) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    if (!row) return [];
    const byFamily = new Map();
    for (const [key, value] of Object.entries(row)) {
      if (DEAD_FIELDS.has(key)) continue;
      const family = familyOf(key);
      if (!byFamily.has(family)) byFamily.set(family, []);
      byFamily.get(family).push({ key, value, hay: haystack(key, family, value) });
    }
    // Display order = rule order, "Identity & meta" naturally last before General.
    const order = FAMILY_RULES.map(([label]) => label);
    return [...byFamily.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [row]);

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      groups
        .map(([family, entries]) => [family, needle ? entries.filter((e) => e.hay.includes(needle)) : entries])
        .filter(([, entries]) => entries.length > 0),
    [groups, needle]
  );

  if (!row) return null;
  const totalShown = filtered.reduce((s, [, e]) => s + e.length, 0);
  const totalAll = groups.reduce((s, [, e]) => s + e.length, 0);

  return (
    <div className="schematic-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary" />
          <h2 className="font-display font-bold uppercase tracking-[0.15em] text-sm">Engine Tunables</h2>
          <span className="tech-label">
            {needle ? `${totalShown} of ${totalAll}` : totalAll} fields · 2 dead columns omitted
          </span>
        </div>
        <label className="flex items-center gap-2 border border-border bg-card px-2 h-8 w-full sm:w-72">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter tunables…"
            className="bg-transparent outline-none font-mono text-[11px] w-full placeholder:text-muted-foreground/60"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="tech-label py-6 text-center">No tunable matches “{q}”.</p>
      ) : (
        <div className="columns-1 lg:columns-2 2xl:columns-3 gap-4 [column-fill:balance]">
          {filtered.map(([family, entries]) => (
            <section key={family} className="break-inside-avoid mb-4 border border-border/60 bg-card/40">
              <h3 className="font-display uppercase tracking-[0.18em] text-[11px] text-primary px-2.5 py-1.5 border-b border-border/60 flex items-baseline justify-between gap-2">
                {family}
                <span className="font-mono text-[9px] text-muted-foreground normal-case tracking-normal">{entries.length}</span>
              </h3>
              <dl>
                {entries.map(({ key, value }) => (
                  <div key={key} className="px-2.5 py-1 border-b border-border/30 last:border-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="font-mono text-[10px] text-muted-foreground break-all flex items-center gap-1.5 min-w-0">
                        {key}
                        {CROSS_REF[key] && <CrossRefBadge note={CROSS_REF[key]} />}
                      </dt>
                      {!isPlainObject(value) && (
                        <dd className="text-right shrink min-w-0">
                          <ValueCell value={value} />
                        </dd>
                      )}
                    </div>
                    {isPlainObject(value) && (
                      <dd className="mt-1 ml-3 border-l border-border/60 pl-2.5">
                        {Object.entries(value).map(([k, v]) => (
                          <div key={k} className="flex items-baseline justify-between gap-3 py-[1px]">
                            <span className="font-mono text-[10px] text-muted-foreground/80 break-all">{k}</span>
                            <ValueCell value={v} />
                          </div>
                        ))}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
