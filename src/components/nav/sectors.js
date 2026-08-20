import { Database, ArrowLeftRight, Layers, DatabaseZap, ScrollText, Wrench, Boxes, HardDriveDownload } from "lucide-react";

// Radial command ring sectors. Each sector expands to reveal its tools.
export const SECTORS = [
  {
    id: "archives",
    label: "Archives",
    code: "SEC-01",
    icon: Database,
    start: -130,
    end: -10,
    tools: [
      { to: "/database", label: "Databank", code: "T-02", icon: Database, desc: "Every value in the installed dataset" },
      { to: "/compare", label: "Comparison Engine", code: "T-03", icon: ArrowLeftRight, desc: "Stat deltas between hulls & modules" },
    ],
  },
  {
    id: "foundry",
    label: "Foundry",
    code: "SEC-02",
    icon: Layers,
    start: -5,
    end: 115,
    tools: [
      { to: "/builder", label: "Build Layout", code: "T-04a", icon: Wrench, desc: "Edit hulls & mount modules live" },
      { to: "/blueprints", label: "Blueprint Database", code: "T-04", icon: Layers, desc: "Registered designs & revisions" },
      { to: "/blueprints", label: "Design Registry", code: "T-04b", icon: ScrollText, desc: "Browse by hull class & tags" },
      { to: "/resources", label: "Resource Planning", code: "T-04c", icon: Boxes, desc: "Aggregate materials for a build queue" },
      { to: "/sync", label: "Blueprint Exchange", code: "T-04d", icon: HardDriveDownload, desc: "Sync designs with Google Drive" },
    ],
  },
  {
    id: "ops",
    label: "Ops",
    code: "SEC-03",
    icon: DatabaseZap,
    start: 120,
    end: 230,
    tools: [
      { to: "/data", label: "Data Ops", code: "T-05", icon: DatabaseZap, desc: "Ingest, watch & sync game files" },
    ],
  },
];