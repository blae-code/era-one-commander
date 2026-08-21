import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster as SonnerToaster } from "sonner";
import JumpRail from "@/components/nav/JumpRail";
import InstallSequence from "@/components/onboarding/InstallSequence";

export default function Layout() {
  const { pathname } = useLocation();
  const isDeck = pathname === "/";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <InstallSequence />
      {!isDeck && <JumpRail />}
      <main id="app-main" className="flex-1 overflow-y-auto bp-grid">
        <Outlet />
      </main>
      <SonnerToaster position="bottom-right" toastOptions={{ style: { borderRadius: 0, fontFamily: "IBM Plex Mono", fontSize: 12 } }} />
    </div>
  );
}