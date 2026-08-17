// Stealth / detection model built on the extracted signature + sensor fields.
//
// Source fields (Unit and Module records):
//   base_signature_noise — always-on emission
//   thrust_noise         — added while under thrust
//   attack_noise         — added while firing
//   cloak_strength/range — emission suppression this hull projects
//   sensors_range/strength, visual_range/visual_strength — detector side
//
// Assumption (documented, not from the game source): a detector acquires a contact when its
// channel strength meets the contact's signature, and its usable acquisition distance scales
// with the strength : signature ratio, capped at the channel's own range.

export const STATES = [
  { key: "silent", label: "Silent running", hint: "drifting, guns cold" },
  { key: "cruise", label: "Under thrust", hint: "engines burning" },
  { key: "engaged", label: "Firing", hint: "weapons hot" },
  { key: "full", label: "Thrust + firing", hint: "worst case" },
];

/** Signature for one behaviour state, after this hull's own cloak suppression. */
export function signatureFor(r, state, cloaked = true) {
  if (!r) return 0;
  const base = r.base_signature_noise || 0;
  const thrust = state === "cruise" || state === "full" ? r.thrust_noise || 0 : 0;
  const attack = state === "engaged" || state === "full" ? r.attack_noise || 0 : 0;
  const cloak = cloaked ? r.cloak_strength || 0 : 0;
  return Math.max(0, base + thrust + attack - cloak);
}

/** All four states at once, for charting. */
export const signatureProfile = (r, cloaked = true) =>
  STATES.map((s) => ({ ...s, signature: signatureFor(r, s.key, cloaked), raw: signatureFor(r, s.key, false) }));

/** Acquisition distance of one detector channel against a given signature. */
export function detectionRange(detector, signature, channel = "sensors") {
  const range = channel === "visual" ? detector?.visual_range || 0 : detector?.sensors_range || 0;
  const strength = channel === "visual" ? detector?.visual_strength || 0 : detector?.sensors_strength || 0;
  if (range <= 0 || strength <= 0) return 0;
  if (signature <= 0) return 0; // perfectly silent contact
  const ratio = strength / signature;
  return ratio >= 1 ? range : range * ratio;
}

/** Best channel result for a detector/contact pair. */
export function detectionFor(detector, signature) {
  const sensors = detectionRange(detector, signature, "sensors");
  const visual = detectionRange(detector, signature, "visual");
  const best = Math.max(sensors, visual);
  return {
    sensors,
    visual,
    best,
    channel: best === 0 ? "none" : sensors >= visual ? "sensors" : "visual",
    verdict: best === 0 ? "undetected" : best >= (detector?.sensors_range || 0) ? "full" : "degraded",
  };
}

export const VERDICT = {
  undetected: { symbol: "✔", label: "Undetected", className: "text-[#38bdf8]" },
  degraded: { symbol: "▲", label: "Close range only", className: "text-[#ffb020]" },
  full: { symbol: "✖", label: "Detected at full range", className: "text-[#ff2d55]" },
};

/** Everything with a sensor or optical channel, sorted by reach — the threat list. */
export const detectorsFrom = (records) =>
  records
    .filter((r) => (r.sensors_range || 0) > 0 || (r.visual_range || 0) > 0)
    .sort((a, b) => (b.sensors_range || 0) - (a.sensors_range || 0));