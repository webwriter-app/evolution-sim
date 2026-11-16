import { normalizeInRange } from "../../../ranges";
import { defineGene } from "../define-gene";
import { MAX_VISION_RANGE, DEFAULT_VISION_RANGE } from "../../constants";
import { shouldMutate } from "../should-mutate";

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
