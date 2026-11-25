import { definedGenes, type GeneName } from "./simulation/genetics/definitions";
import type { SimulationSnapshot } from "./simulation/serialization";

export type HistoryTable = {
  columns: string[];
  rows: (string | number | null)[][];
};

const GENE_NAMES: readonly GeneName[] = definedGenes.map((gene) => gene.name);

export const HISTORY_COLUMNS = [
  "tick",
  "population",
  "food_sources",
  "available_food_sources",
  ...GENE_NAMES.map((name) => `mean_${name.replaceAll("-", "_")}`),
];

const rowCache = new WeakMap<SimulationSnapshot, (number | null)[]>();

function meanAllele(snapshot: SimulationSnapshot, geneName: GeneName) {
  let sum = 0;
  let count = 0;

  for (const agent of snapshot.agents) {
    const allele = agent.genome.find((entry) => entry.geneName === geneName)?.allele;

    if (allele !== undefined) {
      sum += allele;
      count += 1;
    }
  }

  return count > 0 ? Math.round((sum / count) * 1e6) / 1e6 : null;
}

function rowOf(snapshot: SimulationSnapshot) {
  let row = rowCache.get(snapshot);

  if (row === undefined) {
    row = [
      snapshot.tick,
      snapshot.agents.length,
      snapshot.foodSources.length,
      snapshot.foodSources.filter((source) => source.ticksTillRecovery === 0).length,
      ...GENE_NAMES.map((name) => meanAllele(snapshot, name)),
    ];
    rowCache.set(snapshot, row);
  }

  return row;
}

/** One row per recorded tick. Rows are cached per snapshot, so a growing history costs one new row per tick. */
export function createHistoryTable(history: readonly SimulationSnapshot[]): HistoryTable {
  return { columns: HISTORY_COLUMNS, rows: history.map(rowOf) };
}

export function historyTableToCsv({ columns, rows }: HistoryTable) {
  return [columns, ...rows].map((row) => row.join(",")).join("\r\n") + "\r\n";
}
