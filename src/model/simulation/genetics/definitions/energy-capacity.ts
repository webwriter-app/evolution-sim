import { normalizeInRange } from "../../../ranges";
import { defineGene } from "../define-gene";
import {
  DEFAULT_ENERGY_CAPACITY,
  MAX_ENERGY_CAPACITY,
} from "../../constants";
import { shouldMutate } from "../should-mutate";

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
