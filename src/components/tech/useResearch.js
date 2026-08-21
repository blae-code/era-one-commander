import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

const DEBOUNCE_MS = 350;

// Debounced backend-function call. `body` is serialized into the effect key so rapid
// have/target toggles collapse into one request; previous data is kept while reloading.
// invoke() resolves to a full AxiosResponse (body at res.data) and throws a raw AxiosError
// whose useful message lives at e.response.data.error — e.message alone is useless.
export function useResearchCall(name, body, enabled = true) {
  const key = useMemo(() => JSON.stringify(body ?? {}), [body]);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke(name, JSON.parse(key));
        const data = res?.data ?? res;
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || String(e);
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: msg }));
      }
    }, DEBOUNCE_MS);
    return () => { cancelled = true; clearTimeout(t); };
  }, [name, key, enabled, tick]);

  return { ...state, reload: () => setTick((n) => n + 1) };
}
