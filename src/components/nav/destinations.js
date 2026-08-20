import { Database, ArrowLeftRight, Layers, DatabaseZap } from "lucide-react";

export const DESTINATIONS = [
  {
    to: "/database",
    label: "Databank",
    code: "NODE-02",
    icon: Database,
    desc: "Every value in the installed dataset",
    angle: -140,
  },
  {
    to: "/compare",
    label: "Comparison",
    code: "NODE-03",
    icon: ArrowLeftRight,
    desc: "Stat deltas between hulls & modules",
    angle: -50,
  },
  {
    to: "/blueprints",
    label: "Blueprints",
    code: "NODE-04",
    icon: Layers,
    desc: "Registered designs & revisions",
    angle: 50,
  },
  {
    to: "/data",
    label: "Data Ops",
    code: "NODE-05",
    icon: DatabaseZap,
    desc: "Ingest, watch & sync game files",
    angle: 140,
  },
];