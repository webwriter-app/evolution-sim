/// <reference types="mocha" />
import "mocha/mocha.js";
import { expect } from "chai";
import { getMochaConfig } from "@webwriter/build/test";

import { SimulationSnapshot } from "../src/model/simulation/serialization";
import {
  extractAgentSelectionFromHistory,
  extractFoodSourceSelectionFromHistory,
} from "../src/model/entity-inspection";
import { getAlleleColor } from "../src/components/simulation-analysis";

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

mocha.setup(getMochaConfig());

describe("extractAgentSelectionFromHistory", () => {
  it("has no removal tick while the agent is alive", () => {
    const history = [createSnapshot(0, ["a"]), createSnapshot(1, ["a"])];

    expect(extractAgentSelectionFromHistory("a", history)?.removedAtTick).to.equal(
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

    expect(extractAgentSelectionFromHistory("a", history)?.removedAtTick).to.equal(
      2,
    );
  });
});

describe("extractFoodSourceSelectionFromHistory", () => {
  it("uses the first tick without the food source as removal tick", () => {
    const history = [createSnapshot(0, [], ["f"]), createSnapshot(1, [], [])];

    expect(
      extractFoodSourceSelectionFromHistory("f", history)?.removedAtTick,
    ).to.equal(1);
  });
});

describe("getAlleleColor", () => {
  it("gives an allele the same color regardless of other alleles", () => {
    expect(getAlleleColor(4)).to.equal(getAlleleColor(4));
  });

  it("gives neighboring alleles different colors", () => {
    expect(getAlleleColor(4)).to.not.equal(getAlleleColor(5));
  });
});

mocha.run();
