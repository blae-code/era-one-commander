import { useEffect, useState } from "react";

// Service worker registration — called once at boot.
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: window-controls-overlay)").matches ||
  /** @type {any} */ (window.navigator).standalone === true;

// Captures the browser install prompt so the app can offer a real install button.
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    return outcome === "accepted";
  };

  return { canInstall: !!prompt, installed, install };
}

// Live viewport readout — used to show the operator how the layout maps to their display.
export function useDisplayInfo() {
  const read = () => ({
    w: window.innerWidth,
    h: window.innerHeight,
    screenW: window.screen?.width || window.innerWidth,
    screenH: window.screen?.height || window.innerHeight,
    portrait: window.innerHeight >= window.innerWidth,
    standalone: isStandalone(),
    fullscreen: !!document.fullscreenElement,
  });
  const [info, setInfo] = useState(read);
  useEffect(() => {
    const on = () => setInfo(read());
    window.addEventListener("resize", on);
    document.addEventListener("fullscreenchange", on);
    return () => { window.removeEventListener("resize", on); document.removeEventListener("fullscreenchange", on); };
  }, []);
  return info;
}

export const toggleFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
};