export type SimulationEntityKind = "food-source" | "agent";

export const SIMULATION_ENTITY_RENDER_ORDER = [
  { kind: "food-source", zIndex: 1 },
  { kind: "agent", zIndex: 2 },
] as const satisfies readonly {
  kind: SimulationEntityKind;
  zIndex: number;
}[];

export const SIMULATION_ENTITY_LAYERS = Object.fromEntries(
  SIMULATION_ENTITY_RENDER_ORDER.map(({ kind, zIndex }) => [kind, zIndex]),
) as Record<SimulationEntityKind, number>;

export const SIMULATION_ENTITY_TOPMOST_ORDER = [
  ...SIMULATION_ENTITY_RENDER_ORDER,
]
  .sort((a, b) => b.zIndex - a.zIndex)
  .map(({ kind }) => kind);
