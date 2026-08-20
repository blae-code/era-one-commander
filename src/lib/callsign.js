// Local-only pilot identity. The callsign is a self-chosen handle kept in this browser —
// never sent to the backend, never joined to an account, and no real name/email is collected.
import { useCallback, useEffect, useState } from "react";

const KEY = "eraone:callsign";

export const readCallsign = () => {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
};

export function useCallsign() {
  const [callsign, setState] = useState(readCallsign);
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setState(readCallsign()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const setCallsign = useCallback((v) => {
    try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* ignore */ }
    setState(v || null);
  }, []);
  return { callsign, setCallsign, installed: !!callsign };
}

// Strip anything that looks like contact data; keep a terse hull-stencil handle.
export const sanitizeCallsign = (raw) =>
  (raw || "").replace(/[^A-Za-z0-9\- ]/g, "").replace(/\s+/g, " ").trimStart().slice(0, 14).toUpperCase();