import { getDefinedGene } from "./definitions";
import { Genome } from "./genome";

export function getGenomeFromReproduction({
  parentGenome,
  mutationRate,
}: {
  parentGenome: Genome;
  mutationRate: number;
}): Genome {
  return parentGenome.map(({ geneName, allele }) => {
    const geneDefinition = getDefinedGene(geneName);
    const mutatedAllele = geneDefinition.getMutatedAllele(allele, mutationRate);
    return { geneName, allele: mutatedAllele };
  });
}
