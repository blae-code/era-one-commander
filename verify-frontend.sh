#!/usr/bin/env bash
# ERA ONE Commander — frontend verification gate.
# The plan's measurement table (~/.claude/plans/era-one-ops-room-and-drydock.md "The measurement")
# as a runnable script, plus referential checks. Run from the repo root; exits non-zero on any FAIL.
# Baselines measured 2026-08-20 at commit d7fb8e7 (pre-v1.0-baseline tag).
set -uo pipefail
cd "$(dirname "$0")"
FAIL=0
say()  { printf '%-46s %10s   %s\n' "$1" "$2" "$3"; }
gate() { # gate <label> <value> <target-desc> <pass-bool>
  if [ "$4" = 1 ]; then say "$1" "$2" "PASS ($3)"; else say "$1" "$2" "FAIL ($3)"; FAIL=1; fi
}

echo "== ERA ONE Commander frontend gate =="

# -- Referential: every entity name the frontend reads must exist (bundled or hand-authored live-only)
LIVE_ONLY="PlayerDesign"
missing_entities=""
for e in $(grep -rhoE 'useGameEntity(Rows)?\("[A-Za-z]+"' src/ | grep -oE '"[A-Za-z]+"' | tr -d '"' | sort -u); do
  if [ ! -f "src/data/era-one/$e.json" ] && ! grep -qw "$e" <<<"$LIVE_ONLY"; then
    missing_entities="$missing_entities $e"
  fi
done
gate "Entity refs resolve (bundle or live-only)" "${missing_entities:-all}" "no dangling names" "$([ -z "$missing_entities" ] && echo 1 || echo 0)"

# -- Referential: every invoked function must be deployed
# (functions.invoke literals + the tech pages' useResearchCall("name", ...) indirection)
missing_fns=""
for f in $(grep -rhoE '(functions\.invoke|useResearchCall)\("[a-zA-Z]+"' src/ | grep -oE '"[a-zA-Z]+"' | tr -d '"' | sort -u); do
  [ -d "base44/functions/$f" ] || missing_fns="$missing_fns $f"
done
gate "Function refs resolve" "${missing_fns:-all}" "no dangling names" "$([ -z "$missing_fns" ] && echo 1 || echo 0)"

# -- Fiction: zero access sites
FICRE='entities\.(Hull|Component|BlueprintVersion|Blueprint)\b|useGameEntity\("(Hull|Component|BlueprintVersion|Blueprint)"'
fic=$(grep -rlE "$FICRE" src/ 2>/dev/null | wc -l)
gate "Fictional-entity access files" "$fic" "0" "$([ "$fic" -eq 0 ] && echo 1 || echo 0)"

# -- Functions wired
fn=$(grep -rhoE '(functions\.invoke|useResearchCall)\("[a-zA-Z]+"' src/ | grep -oE '"[a-zA-Z]+"' | sort -u | wc -l)
gate "Functions invoked from the UI" "$fn" ">= 9" "$([ "$fn" -ge 9 ] && echo 1 || echo 0)"

# -- Entities read (direct hooks/entities.X, plus the Databank's KIND_ENTITY -> useGameEntityRows loop)
ents=0
for e in $(ls base44/entities/*.jsonc | xargs -n1 basename | sed 's/\.jsonc//'); do
  if grep -rqE "useGameEntity(Rows)?\(\"$e\"|entities\.$e\b" src/ --exclude=seedGameData.js 2>/dev/null \
     || grep -qE "(^|[ {])$e: \"$e\"" src/components/databank/catalog.js 2>/dev/null; then
    ents=$((ents+1))
  fi
done
gate "Entities read by any page/component" "$ents" ">= 30 of 48" "$([ "$ents" -ge 30 ] && echo 1 || echo 0)"

# -- Databank kinds
kinds=$(grep -cE '^\s{2}[A-Za-z]+:\s*\{' src/components/databank/catalog.js 2>/dev/null)
gate "Databank kinds" "$kinds" ">= 30" "$([ "$kinds" -ge 30 ] && echo 1 || echo 0)"

# -- a11y in databank
aria=$(grep -rho 'aria-[a-z]*' src/components/databank/ 2>/dev/null | wc -l)
gate "aria- attributes in databank/" "$aria" ">= 25" "$([ "$aria" -ge 25 ] && echo 1 || echo 0)"

# -- Build stamp
stamp=$(grep -rl 'DatasetBuild' src/components src/pages 2>/dev/null | wc -l)
gate "DatasetBuild stamp rendered" "$stamp" ">= 1 file" "$([ "$stamp" -ge 1 ] && echo 1 || echo 0)"

# -- Route-level code splitting
lazy=$(grep -c 'lazy(' src/App.jsx 2>/dev/null)
gate "Route-level React.lazy" "$lazy" ">= 1" "$([ "$lazy" -ge 1 ] && echo 1 || echo 0)"

# -- Rule 3 tripwire: dps_total rendered without an all-class label nearby is suspect (heuristic, warn-only)
bare=$(grep -rn 'dps_total' src/pages src/components --include='*.jsx' 2>/dev/null | grep -viE 'nominal|all.class|label' | wc -l)
say "dps_total sites lacking nominal label (warn)" "$bare" "review each"

# -- Gates that build the world
echo "-- toolchain gates --"
npm run lint >/dev/null 2>&1
gate "npm run lint" "$?" "exit 0" "$([ $? -eq 0 ] && echo 1 || echo 0)"
tc=$(npm run typecheck 2>&1 | grep -c 'error TS')
gate "typecheck 'error TS' count" "$tc" "<= 196 ratchet" "$([ "$tc" -le 196 ] && echo 1 || echo 0)"
npm run build >/dev/null 2>&1
brc=$?
gate "npm run build" "$brc" "exit 0" "$([ "$brc" -eq 0 ] && echo 1 || echo 0)"
if [ "$brc" -eq 0 ]; then
  idx=$(ls -l dist/assets/index-*.js 2>/dev/null | awk '{print $5}' | sort -rn | head -1)
  gate "eager index chunk bytes" "${idx:-0}" "< 600000" "$([ "${idx:-999999999}" -lt 600000 ] && echo 1 || echo 0)"
fi

echo
[ "$FAIL" -eq 0 ] && echo "ALL GATES PASS" || echo "GATE FAILURES PRESENT"
exit $FAIL
