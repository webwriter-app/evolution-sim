import { normalizeInRange } from "@/utils/ranges";
import { defineGene } from "../defineGene";
import { MAX_VISION_RANGE, DEFAULT_VISION_RANGE } from "@/simulation/constants";
import { shouldMutate } from "../shouldMutate";

export const visionRangeGene = defineGene<"vision-range", number>({
  name: "vision-range",
  min: 1,
  max: MAX_VISION_RANGE,
  applyToPhenotype: (phenotype, allele) => {
    return {
      ...phenotype,
      visionRange: allele,
    };
  },
  getMutatedAllele: (allele, mutationRate) => {
    if (shouldMutate(mutationRate)) {
      const mutation = Math.random() < 0.5 ? -1 : 1;
      return normalizeInRange({
        min: 1,
        max: MAX_VISION_RANGE,
        value: allele + mutation,
      });
    }
    return allele;
  },
  yieldNewAllele: () => {
    return DEFAULT_VISION_RANGE;
  },
});
