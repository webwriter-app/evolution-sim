import { describe, expect, it } from "vitest";
import { SimulationSnapshot } from "@/simulation/serialization";
import {
  extractAgentSelectionFromHistory,
  extractFoodSourceSelectionFromHistory,
} from "./entityInspection";
import { getAlleleColor } from "./simulationAnalysis";

function createSnapshot(
  tick: number,
  agentIds: string[],
  foodSourceIds: string[] = [],
): SimulationSnapshot {
  return {
    tick,
    agents: agentIds.map((id) => ({ id })),
    foodSources: foodSourceIds.map((id) => ({ id })),
  } as unknown as SimulationSnapshot;
}

describe("extractAgentSelectionFromHistory", () => {
  it("has no removal tick while the agent is alive", () => {
    const history = [createSnapshot(0, ["a"]), createSnapshot(1, ["a"])];

    expect(extractAgentSelectionFromHistory("a", history)?.removedAtTick).toBe(
      null,
    );
  });

  it("uses the first tick without the agent as removal tick", () => {
    const history = [
      createSnapshot(0, ["a", "b"]),
      createSnapshot(1, ["a", "b"]),
      createSnapshot(2, ["b"]),
      createSnapshot(3, ["b"]),
    ];

    expect(extractAgentSelectionFromHistory("a", history)?.removedAtTick).toBe(
      2,
    );
  });
});

describe("extractFoodSourceSelectionFromHistory", () => {
  it("uses the first tick without the food source as removal tick", () => {
    const history = [createSnapshot(0, [], ["f"]), createSnapshot(1, [], [])];

    expect(
      extractFoodSourceSelectionFromHistory("f", history)?.removedAtTick,
    ).toBe(1);
  });
});

describe("getAlleleColor", () => {
  it("gives an allele the same color regardless of other alleles", () => {
    expect(getAlleleColor(4)).toBe(getAlleleColor(4));
  });

  it("gives neighboring alleles different colors", () => {
    expect(getAlleleColor(4)).not.toBe(getAlleleColor(5));
  });
});
