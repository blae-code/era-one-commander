import React, { useState } from "react";
import GameData from "@/pages/GameData";
import ImportData from "@/pages/ImportData";

const TABS = [
  { key: "bundled", label: "Bundled Dataset", code: "A" },
  { key: "upload", label: "File Import", code: "B" },
];

export default function DataOps() {
  const [tab, setTab] = useState("bundled");

  return (
    <div>
      <div className="border-b border-border bg-[hsl(30_8%_7%)] px-6 flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 font-display font-semibold text-sm uppercase tracking-wide border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="font-mono text-[9px] opacity-50 ml-2">{t.code}</span>
          </button>
        ))}
      </div>
      {tab === "bundled" ? <GameData /> : <ImportData />}
    </div>
  );
}