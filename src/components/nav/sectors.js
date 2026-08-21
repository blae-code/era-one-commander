import { Database, ArrowLeftRight, Layers, DatabaseZap, Boxes, HardDriveDownload, LineChart, Crosshair, GitBranch, MonitorDown, EyeOff, Anchor, Ship, Map as MapIcon, Radar, Fingerprint, Settings2 } from "lucide-react";

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
      { to: "/compare", label: "Comparison Engine", code: "T-03", icon: ArrowLeftRight, desc: "Stat deltas between units & modules" },
      { to: "/economy", label: "Research & Economy", code: "T-03b", icon: LineChart, desc: "Tech-tree cost curves & module value plots" },
      { to: "/combat", label: "Combat Lab", code: "T-03c", icon: Crosshair, desc: "Time-to-kill, firing cycles & approach envelopes" },
      { to: "/tech", label: "Tech Tree", code: "T-03d", icon: GitBranch, desc: "Research milestones & the modules they unlock" },
      { to: "/stealth", label: "Stealth Analysis", code: "T-03e", icon: EyeOff, desc: "Signatures, detection ranges & first-sight" },
      { to: "/fleet", label: "Fleet Analysis", code: "T-03f", icon: Ship, desc: "Compose a force · fleetPlan roll-up" },
      { to: "/theatre", label: "Theatre", code: "T-03g", icon: MapIcon, desc: "Pre-match map boards · every placement on every shipped map" },
      { to: "/threat", label: "Threat Clock", code: "T-03h", icon: Radar, desc: "Enemy wave timeline — composition & cumulative threat" },
      { to: "/dossier", label: "AI Dossier", code: "T-03i", icon: Fingerprint, desc: "The five opponent personalities as intelligence files" },
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
      { to: "/designs", label: "The Drydock", code: "T-04a", icon: Anchor, desc: "Ship & station designs — assembly graphs & .station import" },
      { to: "/resources", label: "Resource Planning", code: "T-04c", icon: Boxes, desc: "Aggregate materials for a build queue" },
      { to: "/sync", label: "Design Exchange", code: "T-04d", icon: HardDriveDownload, desc: "Sync imported designs with Google Drive" },
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
      { to: "/constants", label: "Game Constants", code: "T-07", icon: Settings2, desc: "Every global tunable the game ships, transposed" },
      { to: "/install", label: "Desktop Install", code: "T-06", icon: MonitorDown, desc: "Pin the terminal to a second monitor" },
    ],
  },
];