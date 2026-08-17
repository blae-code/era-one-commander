import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Toaster as SonnerToaster } from "sonner";
import { LayoutDashboard, Wrench, Layers, Database, ArrowLeftRight } from "lucide-react";
import { LogoIcon } from "@/components/icons/EraIcons";

const NAV = [
  { to: "/", label: "Command Deck", code: "01", icon: LayoutDashboard },
  { to: "/builder", label: "Ship Builder", code: "02", icon: Wrench },
  { to: "/blueprints", label: "Blueprints", code: "03", icon: Layers },
  { to: "/database", label: "Databank", code: "04", icon: Database },
  { to: "/compare", label: "Comparison", code: "05", icon: ArrowLeftRight },
];

export default function Layout() {
  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <aside className="w-52 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <LogoIcon size={26} className="text-primary" />
          <div className="leading-none">
            <div className="font-display font-bold text-[15px] tracking-[0.2em]">ERA ONE</div>
            <div className="tech-label mt-0.5">Tactical Companion</div>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map(({ to, label, code, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 border-l-2 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`
              }
            >
              <Icon size={16} />
              <span className="font-display font-semibold text-sm tracking-wide uppercase flex-1">{label}</span>
              <span className="font-mono text-[9px] opacity-50">{code}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-border">
          <div className="tech-label">SYS // NOMINAL</div>
          <div className="mt-1.5 h-1 bg-secondary overflow-hidden">
            <div className="h-full w-3/4 bg-emerald-500/70" />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bp-grid">
        <Outlet />
      </main>
      <SonnerToaster position="bottom-right" toastOptions={{ style: { borderRadius: 0, fontFamily: "IBM Plex Mono", fontSize: 12 } }} />
    </div>
  );
}