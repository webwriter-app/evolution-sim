import { normalizeInRange } from "@/utils/ranges";
import { defineGene } from "../defineGene";
import {
  DEFAULT_ENERGY_CAPACITY,
  MAX_ENERGY_CAPACITY,
} from "@/simulation/constants";
import { shouldMutate } from "../shouldMutate";

export const energyCapacityGene = defineGene<"energy-capacity", number>({
  name: "energy-capacity",
  min: 1,
  max: MAX_ENERGY_CAPACITY,
  applyToPhenotype: (phenotype, allele) => {
    return {
      ...phenotype,
      energyCapacity: allele,
    };
  },
  getMutatedAllele: (allele, mutationRate) => {
    if (shouldMutate(mutationRate)) {
      const mutation = Math.random() < 0.5 ? -1 : 1;
      return normalizeInRange({
        min: 1,
        max: MAX_ENERGY_CAPACITY,
        value: allele + mutation,
      });
    }
    return allele;
  },
  yieldNewAllele: () => {
    return DEFAULT_ENERGY_CAPACITY;
  },
});
