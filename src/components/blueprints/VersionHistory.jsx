// NEUTRALIZED (v1.0 fiction ban, 2026-08-20): this component read and wrote the retired fictional
// Blueprint/BlueprintVersion entities (grid-model revision history). PlayerDesign — the real
// imported-design entity — has no revision model yet, so The Drydock (/designs) does not use it.
// Kept as an inert stub because legacy pages still import it; slated for deletion in a later wave.
export default function VersionHistory() {
  return null;
}
