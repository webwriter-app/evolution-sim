import { msg } from "@lit/localize";
import { GeneName } from "@/simulation/genetics/definitions";

export interface GeneTexts {
  label: string;
  description: string;
}

const geneTexts: Record<GeneName, () => GeneTexts> = {
  "vision-range": () => ({
    label: msg("Vision Range"),
    description: msg(
      "How far the agent can perceive nearby agents and food sources.",
    ),
  }),
  "energy-capacity": () => ({
    label: msg("Energy Capacity"),
    description: msg("The maximum amount of energy the agent can store."),
  }),
};

export function getGeneTexts(geneName: GeneName): GeneTexts {
  return geneTexts[geneName]();
}
