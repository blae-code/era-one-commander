import React, { useState } from "react";
import AdvisorHeader from "@/components/advisor/AdvisorHeader";
import AgentChat from "@/components/advisor/AgentChat";
import { Wrench, GitCompareArrows, FlaskConical } from "lucide-react";

const AGENTS = [
  {
    name: "build_advisor",
    label: "Build Advisor",
    code: "A",
    icon: Wrench,
    tagline: "Design critique // power, mounts, target classes and research gaps",
    prompts: [
      "Review my most recent blueprint and list its weaknesses.",
      "Which weapon modules give the best DPS per resource cost?",
      "Is my fleet's anti-heavy coverage sufficient?",
    ],
  },
  {
    name: "patch_analyst",
    label: "Patch Analyst",
    code: "B",
    icon: GitCompareArrows,
    tagline: "Balance tracking // version deltas and affected designs",
    prompts: [
      "What game version is the stored data from, and how complete is it?",
      "Summarise the current balance outliers across modules and weapons.",
      "Which of my blueprints rely on the most expensive modules?",
    ],
  },
  {
    name: "research_coach",
    label: "Research Coach",
    code: "C",
    icon: FlaskConical,
    tagline: "Tech planning // ordered, costed prerequisite chains",
    prompts: [
      "Plan the shortest research path to unlock heavy ion weapons.",
      "What do I need to research for advanced fusion power?",
      "Which tier 2 research nodes give the best stat value for their cost?",
    ],
  },
];

export default function Advisory() {
  const [active, setActive] = useState(AGENTS[0].name);
  const agent = AGENTS.find((a) => a.name === active);

  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full">
      <AdvisorHeader agents={AGENTS} active={active} onSelect={setActive} />
      <AgentChat key={agent.name} agent={agent} />
    </div>
  );
}