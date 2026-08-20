import { useEffect } from "react";

const VIEWS = ["table", "cards", "heat", "plot", "damage", "para"];

// Global Databank hotkeys: 1–6 switch view, g groups rows.
export function useDatabankKeys(db) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= VIEWS.length) { e.preventDefault(); db.setView(VIEWS[n - 1]); }
      if (e.key === "g") { e.preventDefault(); db.setGrouped(!db.grouped); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [db]);
}