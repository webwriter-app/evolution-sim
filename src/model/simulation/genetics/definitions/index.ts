import { hasNoValue } from "../../../type-guards";
import { visionRangeGene } from "./vision-range";
import { energyCapacityGene } from "./energy-capacity";

export const definedGenes = [visionRangeGene, energyCapacityGene] as const;

export function getDefinedGene<TGeneName extends GeneName>(
  name: TGeneName,
): Extract<DefinedGene, { name: TGeneName }> {
  const gene = definedGenes.find(
    (gene): gene is Extract<DefinedGene, { name: TGeneName }> =>
      gene.name === name,
  );

  if (hasNoValue(gene)) {
    // TODO remove dead path
    throw new Error(`Gene with name ${name} not found`);
  }

  return gene;
}

export type DefinedGene = (typeof definedGenes)[number];

export type GeneName = DefinedGene["name"];
