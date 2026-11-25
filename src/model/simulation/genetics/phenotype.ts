import {
  AGENT_REPRODUCTION_COST,
  AGENT_MOVE_COST,
  DEFAULT_ENERGY_CAPACITY,
  DEFAULT_VISION_RANGE,
} from "../constants";
import { getDefinedGene } from "./definitions";
import { Genome } from "./genome";

export interface Phenotype {
  energyCapacity: number;
  reproductionCost: number;
  moveCost: number;
  visionRange: number;
}

function applyGenomeEntryToPhenotype(
  phenotype: Phenotype,
  entry: Genome[number],
): Phenotype {
  const gene = getDefinedGene(entry.geneName);
  return gene.applyToPhenotype(phenotype, entry.allele);
}

export function getAgentPhenotype(genome: Genome): Phenotype {
  const defaultPhenotype: Phenotype = {
    energyCapacity: DEFAULT_ENERGY_CAPACITY,
    reproductionCost: AGENT_REPRODUCTION_COST,
    moveCost: AGENT_MOVE_COST,
    visionRange: DEFAULT_VISION_RANGE,
  };

  const phenotype = genome.reduce(
    (phenotype, entry) => applyGenomeEntryToPhenotype(phenotype, entry),
    defaultPhenotype,
  );

  return phenotype;
}
