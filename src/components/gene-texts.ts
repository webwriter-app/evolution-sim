import type { MsgFn } from "@lit/localize";
import { GeneName } from "../model/simulation/genetics/definitions";

interface GeneTexts {
  label: string;
  description: string;
}

const geneTexts: Record<GeneName, (msg: MsgFn) => GeneTexts> = {
  "vision-range": (msg) => ({
    label: msg("Vision Range"),
    description: msg(
      "How far the agent can perceive nearby agents and food sources.",
    ),
  }),
  "energy-capacity": (msg) => ({
    label: msg("Energy Capacity"),
    description: msg("The maximum amount of energy the agent can store."),
  }),
};

export function getGeneTexts(geneName: GeneName, msg: MsgFn): GeneTexts {
  return geneTexts[geneName](msg);
}
