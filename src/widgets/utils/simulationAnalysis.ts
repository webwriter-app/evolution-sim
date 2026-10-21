import { msg } from "@lit/localize";
import { GeneName } from "@/simulation/genetics/definitions";
import { AgentSnapshot, SimulationSnapshot } from "@/simulation/serialization";
import { hasValue } from "@/utils/typeGuards";

export type HistorySubsetPreset = "last-50" | "last-100" | "last-250" | "full";

export interface HistorySubsetOption {
  value: HistorySubsetPreset;
  getLabel: () => string;
  limit: number | null;
  roundToMultipleOf?: number;
  mayLag?: boolean;
}

export interface ChartPoint {
  x: number;
  y: number;
}

export interface AlleleShareSeries {
  allele: number;
  data: ChartPoint[];
}

export interface AlleleDistributionEntry {
  allele: number;
  count: number;
  share: number;
}

export const HISTORY_SUBSET_OPTIONS: HistorySubsetOption[] = [
  {
    value: "last-50",
    getLabel: () => msg("Last 50 ticks"),
    limit: 50,
    roundToMultipleOf: 10,
  },
  {
    value: "last-100",
    getLabel: () => msg("Last 100 ticks"),
    limit: 100,
    roundToMultipleOf: 20,
  },
  {
    value: "last-250",
    getLabel: () => msg("Last 250 ticks"),
    limit: 250,
    roundToMultipleOf: 50,
  },
  {
    value: "full",
    getLabel: () => msg("Full history"),
    limit: null,
    mayLag: true,
  },
];

export const DEFAULT_HISTORY_SUBSET_PRESET: HistorySubsetPreset = "last-100";

function roundUpToMultiple(value: number, multiple: number) {
  return Math.ceil(value / multiple) * multiple;
}

export function getHistorySubset(
  history: readonly SimulationSnapshot[],
  preset: HistorySubsetPreset,
): SimulationSnapshot[] {
  const option = HISTORY_SUBSET_OPTIONS.find(
    (option) => option.value === preset,
  );

  if (!option?.limit) {
    return Array.from(history);
  }

  const snapshots = Array.from(history);
  const firstSnapshot = snapshots[0];
  const latestSnapshot = snapshots[snapshots.length - 1];

  if (!firstSnapshot || !latestSnapshot) {
    return [];
  }

  const firstTick = firstSnapshot.tick;
  const latestTick = latestSnapshot.tick;
  const rawStartTick = latestTick - option.limit + 1;

  if (rawStartTick <= firstTick) {
    return snapshots;
  }

  const startTickAlignmentMultiple = option.roundToMultipleOf;
  const alignedStartTick = hasValue(startTickAlignmentMultiple)
    ? roundUpToMultiple(rawStartTick, startTickAlignmentMultiple)
    : rawStartTick;
  const alignedSubset = snapshots.filter(
    (snapshot) => snapshot.tick >= alignedStartTick,
  );

  if (alignedSubset.length > 0) {
    return alignedSubset;
  }

  return snapshots.filter((snapshot) => snapshot.tick >= rawStartTick);
}

export function createPopulationSeries(
  snapshots: readonly SimulationSnapshot[],
): ChartPoint[] {
  return snapshots.map((snapshot) => ({
    x: snapshot.tick,
    y: snapshot.agents.length,
  }));
}

export function createFoodAvailabilitySeries(
  snapshots: readonly SimulationSnapshot[],
): ChartPoint[] {
  return snapshots.map((snapshot) => {
    const totalFoodSources = snapshot.foodSources.length;
    const availableFoodSources = snapshot.foodSources.filter(
      (foodSource) => foodSource.ticksTillRecovery === 0,
    ).length;

    return {
      x: snapshot.tick,
      y: totalFoodSources > 0 ? availableFoodSources / totalFoodSources : 0,
    };
  });
}

function getGeneAllele(
  agent: AgentSnapshot,
  geneName: GeneName,
): number | null {
  return (
    agent.genome.find((entry) => entry.geneName === geneName)?.allele ?? null
  );
}

export function getAllelesForGene(
  snapshots: readonly SimulationSnapshot[],
  geneName: GeneName,
): number[] {
  const alleles = new Set<number>();

  for (const snapshot of snapshots) {
    for (const agent of snapshot.agents) {
      const allele = getGeneAllele(agent, geneName);

      if (allele !== null) {
        alleles.add(allele);
      }
    }
  }

  return Array.from(alleles).sort((a, b) => a - b);
}

function getAlleleShareForSnapshot(
  snapshot: SimulationSnapshot,
  geneName: GeneName,
  allele: number,
): number {
  const geneAlleles = snapshot.agents
    .map((agent) => getGeneAllele(agent, geneName))
    .filter((agentAllele): agentAllele is number => agentAllele !== null);

  if (geneAlleles.length === 0) {
    return 0;
  }

  const matchingAlleles = geneAlleles.filter(
    (agentAllele) => agentAllele === allele,
  ).length;

  return matchingAlleles / geneAlleles.length;
}

export function createAlleleShareOverTimeSeries({
  snapshots,
  geneName,
  alleles = getAllelesForGene(snapshots, geneName),
}: {
  snapshots: readonly SimulationSnapshot[];
  geneName: GeneName;
  alleles?: readonly number[];
}): AlleleShareSeries[] {
  return alleles.map((allele) => ({
    allele,
    data: snapshots.map((snapshot) => ({
      x: snapshot.tick,
      y: getAlleleShareForSnapshot(snapshot, geneName, allele),
    })),
  }));
}

export function createCurrentAlleleDistribution({
  snapshot,
  geneName,
}: {
  snapshot: SimulationSnapshot | null;
  geneName: GeneName;
}): AlleleDistributionEntry[] {
  if (!snapshot) {
    return [];
  }

  const alleleCounts = new Map<number, number>();
  let totalGeneAlleles = 0;

  for (const agent of snapshot.agents) {
    const allele = getGeneAllele(agent, geneName);

    if (allele !== null) {
      alleleCounts.set(allele, (alleleCounts.get(allele) ?? 0) + 1);
      totalGeneAlleles += 1;
    }
  }

  return Array.from(alleleCounts.entries())
    .map(([allele, count]) => ({
      allele,
      count,
      share: totalGeneAlleles > 0 ? count / totalGeneAlleles : 0,
    }))
    .sort((a, b) => a.allele - b.allele);
}

const ALLELE_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

export function getAlleleColor(allele: number) {
  const length = ALLELE_COLORS.length;
  const index = ((Math.round(allele) % length) + length) % length;
  return ALLELE_COLORS[index] ?? "#1f77b4";
}
