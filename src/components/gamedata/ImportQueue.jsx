import React from "react";
import { X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const STATE = {
  ready: { cls: "text-[#38bdf8]", label: "ready" },
  running: { cls: "text-[#ffb020]", label: "importing" },
  done: { cls: "text-[#38bdf8]", label: "imported" },
  error: { cls: "text-[#ff2d55]", label: "error" },
};

export default function ImportQueue({ items, onRemove, disabled }) {
  if (items.length === 0) return null;

  return (
    <div className="schematic-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/90">
          <tr className="text-left">
            {["File", "Entity", "Records", "Build", "State", ""].map((h) => (
              <th key={h} className="tech-label px-3 py-2 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((it) => {
            const st = STATE[it.state] || STATE.ready;
            return (
              <tr key={it.key}>
                <td className="px-3 py-2 font-mono text-xs">{it.fileName}</td>
                <td className="px-3 py-2 font-mono text-xs">{it.entity || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{it.rows.length || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{it.rows[0]?.game_build || "—"}</td>
                <td className={`px-3 py-2 font-mono text-xs uppercase ${st.cls}`}>
                  {it.state === "running" && <Loader2 size={12} className="inline mr-1 -mt-0.5 animate-spin" />}
                  {it.state === "done" && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
                  {it.state === "error" && <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />}
                  {it.state === "error" ? it.error : it.state === "done" ? it.summary : st.label}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => onRemove(it.key)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-[#ff2d55] disabled:opacity-40"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}