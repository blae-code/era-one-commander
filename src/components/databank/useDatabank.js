// Databank state: URL params (shareable) + localStorage (personal: favourites, presets, columns, density).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { KINDS, KIND_KEYS } from "./catalog";

const LS = {
  get(k, d) { try { const v = localStorage.getItem(`databank:${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`databank:${k}`, JSON.stringify(v)); } catch { /* ignore */ } },
};

export function useDatabank() {
  const [params, setParams] = useSearchParams();
  const kindKey = KIND_KEYS.includes(params.get("t")) ? params.get("t") : "Module";
  const kind = KINDS[kindKey];

  // URL-backed
  const q = params.get("q") || "";
  const sortKey = params.get("sort") || null;
  const sortDir = params.get("dir") || "desc";
  const view = params.get("view") || "table";
  const selectedId = params.get("id") || null;
  const compareIds = (params.get("cmp") || "").split(",").filter(Boolean);
  const facetSel = useMemo(() => {
    const out = {};
    for (const [key] of kind.facets) { const v = params.get(`f.${key}`); if (v) out[key] = new Set(v.split("|")); }
    return out;
  }, [params, kind]);
  const ranges = useMemo(() => {
    const out = {};
    for (const key of kind.ranges) { const v = params.get(`r.${key}`); if (v) { const [lo, hi] = v.split("..").map((x) => (x === "" ? null : Number(x))); out[key] = [lo, hi]; } }
    return out;
  }, [params, kind]);
  const favOnly = params.get("fav") === "1";
  const hideWip = params.get("wip") !== "1";
  const grouped = params.get("grp") === "1";
  const plotX = params.get("px") || null;
  const plotY = params.get("py") || null;

  // History discipline: user-meaningful state changes (kind switch, drawer open/close, view,
  // facet toggles, compare, clear) PUSH so the browser Back button undoes them instead of leaving
  // the Databank. Keystroke/drag-level changes (query typing, range sliders, sort, plot axes)
  // REPLACE so they never flood the history.
  const patch = useCallback((changes, { push = false } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(changes)) { if (v === null || v === undefined || v === "" || v === false) next.delete(k); else next.set(k, String(v)); }
      return next;
    }, { replace: !push });
  }, [setParams]);

  // Kind switch keeps what still makes sense across kinds (query words, fav/wip toggles, and the
  // generic views); facets, ranges, sort and selection are per-kind and reset.
  const KEEP_VIEWS = ["cards", "plot", "para"];
  const kindParams = (prev, k) => {
    const next = new URLSearchParams();
    next.set("t", k);
    for (const key of ["q", "fav", "wip"]) { const v = prev.get(key); if (v) next.set(key, v); }
    const v = prev.get("view"); if (v && KEEP_VIEWS.includes(v)) next.set("view", v);
    return next;
  };
  const setKind = (k) => setParams((prev) => kindParams(prev, k), { replace: false });
  // Cross-kind jump (⌘K / search suggestion): one history entry that switches kind AND selects.
  const jumpTo = (k, id) => setParams((prev) => { const next = kindParams(prev, k); next.set("id", id); return next; }, { replace: false });
  const setQuery = (v) => patch({ q: v });
  const setSort = (key) => patch({ sort: key, dir: sortKey === key ? (sortDir === "desc" ? "asc" : "desc") : "desc" });
  const setView = (v) => patch({ view: v === "table" ? null : v }, { push: true });
  const select = (id) => patch({ id }, { push: true });
  const toggleCompare = (id) => {
    const s = new Set(compareIds); if (s.has(id)) s.delete(id); else if (s.size < 4) s.add(id);
    patch({ cmp: [...s].join(",") }, { push: true });
  };
  const clearCompare = () => patch({ cmp: null }, { push: true });
  const toggleFacet = (fk, val) => {
    const s = new Set(facetSel[fk] || []); if (s.has(val)) s.delete(val); else s.add(val);
    patch({ [`f.${fk}`]: [...s].join("|") }, { push: true });
  };
  const clearFacet = (fk) => patch({ [`f.${fk}`]: null }, { push: true });
  const setRange = (rk, lo, hi) => patch({ [`r.${rk}`]: lo == null && hi == null ? null : `${lo ?? ""}..${hi ?? ""}` });
  const setFavOnly = (v) => patch({ fav: v ? "1" : null }, { push: true });
  const setGrouped = (v) => patch({ grp: v ? "1" : null }, { push: true });
  const setPlotAxes = (x, y) => patch({ px: x, py: y });
  const setHideWip = (v) => patch({ wip: v ? null : "1" }, { push: true });
  const clearAll = () => setParams({ t: kindKey }, { replace: false });

  // localStorage-backed
  const [favorites, setFavorites] = useState(() => new Set(LS.get("favorites", [])));
  const toggleFavorite = (id) => setFavorites((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); LS.set("favorites", [...s]); return s; });
  const [density, setDensityState] = useState(() => LS.get("density", "normal"));
  const setDensity = (d) => { setDensityState(d); LS.set("density", d); };
  const [columnsByKind, setColumnsByKind] = useState(() => LS.get("columns", {}));
  const visibleCols = columnsByKind[kindKey] || kind.columns.filter((c) => c.on).map((c) => c.key);
  const setVisibleCols = (keys) => setColumnsByKind((prev) => { const n = { ...prev, [kindKey]: keys }; LS.set("columns", n); return n; });
  const resetCols = () => setColumnsByKind((prev) => { const n = { ...prev }; delete n[kindKey]; LS.set("columns", n); return n; });
  const [presets, setPresets] = useState(() => LS.get("presets", []));
  const savePreset = (name) => {
    const p = { name, kind: kindKey, url: params.toString(), cols: visibleCols, ts: Date.now() };
    setPresets((prev) => { const n = [...prev.filter((x) => x.name !== name || x.kind !== kindKey), p]; LS.set("presets", n); return n; });
  };
  const loadPreset = (p) => { setParams(new URLSearchParams(p.url), { replace: false }); if (p.cols) setColumnsByKind((prev) => { const n = { ...prev, [p.kind]: p.cols }; LS.set("columns", n); return n; }); };
  const deletePreset = (p) => setPresets((prev) => { const n = prev.filter((x) => x !== p); LS.set("presets", n); return n; });
  const [recents, setRecents] = useState(() => LS.get("recents", []));
  const pushRecent = useCallback((id) => setRecents((prev) => {
    if (!id || prev[0] === id) return prev;
    const n = [id, ...prev.filter((x) => x !== id)].slice(0, 12);
    LS.set("recents", n); return n;
  }), []);
  const [notes, setNotes] = useState(() => LS.get("notes", {}));
  const setNote = (id, text) => setNotes((prev) => { const n = { ...prev, [id]: text }; if (!text) delete n[id]; LS.set("notes", n); return n; });

  useEffect(() => { /* keep hook order stable */ }, []);

  return {
    kindKey, kind, q, sortKey, sortDir, view, selectedId, compareIds, facetSel, ranges, favOnly, hideWip, grouped, plotX, plotY,
    setKind, jumpTo, setQuery, setSort, setView, select, toggleCompare, clearCompare, toggleFacet, clearFacet, setRange, setFavOnly, setHideWip, setGrouped, setPlotAxes, clearAll,
    favorites, toggleFavorite, density, setDensity, visibleCols, setVisibleCols, resetCols, presets, savePreset, loadPreset, deletePreset, notes, setNote, recents, pushRecent,
    params,
  };
}