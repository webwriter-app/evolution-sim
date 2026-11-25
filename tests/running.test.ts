/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert, expect } from "chai";
import { getMochaConfig } from "@webwriter/build/test";

import {
  addAgent,
  addFoodSource,
  removeEntityAt,
  runSimulation,
  Simulation,
} from "../src/model/simulation/running";
import { spawnAgent } from "../src/model/simulation/agent/agent";
import { AgentState } from "../src/model/simulation/agent/state";
import { VEC_0 } from "../src/model/simulation/position";
import { FoodSource } from "../src/model/simulation/food-source";
import { hasValue } from "../src/model/type-guards";
import { initializeGenome } from "../src/model/simulation/genetics/genome";

mocha.setup(getMochaConfig());

describe("running simulation", () => {
  function createTestAgent(state: Partial<AgentState>) {
    const defaultState: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 100,
    };

    const agent = spawnAgent({
      position: VEC_0,
      genome: initializeGenome(),
      parentIds: [],
    });
    agent.state = {
      ...defaultState,
      ...state,
    };

    return agent;
  }

  function createTestFoodSource(overrides: Partial<FoodSource>) {
    const defaultFoodSource: Simulation["foodSources"][number] = {
      id: "food-source-1",
      position: { x: 0, y: 0 },
      baseEnergyGainFromConsumption: 50,
      recoveryRate: 10,
      ticksTillRecovery: 0,
    };

    return {
      ...defaultFoodSource,
      ...overrides,
    };
  }

  function createTestSimulation(overrides: Partial<Simulation>): Simulation {
    const defaultSimulation: Simulation = {
      agents: [],
      foodSources: [],
      metadata: {
        worldSize: { x: 10, y: 10 },
        mutationRate: 0.3,
      },
    };

    return {
      ...defaultSimulation,
      ...overrides,
    };
  }

  it("removes agents that have died during the tick", () => {
    const deadAgent = createTestAgent({ currentEnergy: 0 });

    const simulation = createTestSimulation({
      agents: [deadAgent],
    });

    const updatedSimulation = runSimulation(simulation);

    expect(updatedSimulation.agents).to.have.lengthOf(0);
  });
  it("tracks reproduced agent parents on the child", () => {
    const parent = createTestAgent({ currentEnergy: 1000 });
    const simulation = createTestSimulation({ agents: [parent] });

    const updatedSimulation = runSimulation(simulation);

    const child = updatedSimulation.agents.find(
      (agent) => agent.id !== parent.id,
    );

    assert(hasValue(child));
    expect(child.parentIds).to.deep.equal([parent.id]);
  });

  it("updates food sources with correct recovery ticks", () => {
    const testTicksTillRecovery = 1;
    const foodSource = createTestFoodSource({
      ticksTillRecovery: testTicksTillRecovery,
    });

    const simulation = createTestSimulation({
      foodSources: [foodSource],
    });

    const updatedSimulation = runSimulation(simulation);

    const updatedFoodSource = updatedSimulation.foodSources.at(0);

    assert(hasValue(updatedFoodSource));
    expect(updatedFoodSource.ticksTillRecovery).to.equal(testTicksTillRecovery - 1);
  });

  it("adds a food source at a valid position", () => {
    const position = { x: 1, y: 2 };
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, position);

    expect(updatedSimulation.foodSources).to.have.lengthOf(1);
    expect(updatedSimulation.foodSources[0]?.position).to.deep.equal(position);
  });

  it("does not add a food source outside negative bounds", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, { x: -1, y: 0 });

    expect(updatedSimulation.foodSources).to.have.lengthOf(0);
  });

  it("does not add a food source outside the world size", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, { x: 10, y: 0 });

    expect(updatedSimulation.foodSources).to.have.lengthOf(0);
  });

  it("does not add a food source at a non-integer position", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, { x: 1.5, y: 0 });

    expect(updatedSimulation.foodSources).to.have.lengthOf(0);
  });

  it("does not add a food source at an occupied food source position", () => {
    const foodSource = createTestFoodSource({
      position: { x: 1, y: 2 },
    });
    const simulation = createTestSimulation({ foodSources: [foodSource] });

    const updatedSimulation = addFoodSource(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.foodSources).to.have.lengthOf(1);
  });

  it("adds an agent at a valid position with a default genome", () => {
    const position = { x: 1, y: 2 };
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, position);

    expect(updatedSimulation.agents).to.have.lengthOf(1);
    expect(updatedSimulation.agents[0]?.state.position).to.deep.equal(position);
    expect(updatedSimulation.agents[0]?.genome).to.deep.equal(initializeGenome());
    expect(updatedSimulation.agents[0]?.parentIds).to.deep.equal([]);
  });

  it("does not add an agent outside negative bounds", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, { x: -1, y: 0 });

    expect(updatedSimulation.agents).to.have.lengthOf(0);
  });

  it("does not add an agent outside the world size", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, { x: 10, y: 0 });

    expect(updatedSimulation.agents).to.have.lengthOf(0);
  });

  it("does not add an agent at a non-integer position", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, { x: 1.5, y: 0 });

    expect(updatedSimulation.agents).to.have.lengthOf(0);
  });

  it("does not add an agent at an occupied agent position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ agents: [agent] });

    const updatedSimulation = addAgent(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).to.have.lengthOf(1);
  });

  it("removes a food source at a position", () => {
    const foodSource = createTestFoodSource({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ foodSources: [foodSource] });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.foodSources).to.have.lengthOf(0);
  });

  it("removes an agent at a position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ agents: [agent] });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).to.have.lengthOf(0);
  });

  it("removes only one entity at a position", () => {
    const firstAgent = createTestAgent({ position: { x: 1, y: 2 } });
    const secondAgent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({
      agents: [firstAgent, secondAgent],
    });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).to.have.lengthOf(1);
    expect(updatedSimulation.agents[0]?.id).to.equal(secondAgent.id);
  });

  it("prefers removing an agent over a food source at the same position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const foodSource = createTestFoodSource({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({
      agents: [agent],
      foodSources: [foodSource],
    });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).to.have.lengthOf(0);
    expect(updatedSimulation.foodSources).to.have.lengthOf(1);
  });

  it("does not remove anything at an empty position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const foodSource = createTestFoodSource({ position: { x: 3, y: 4 } });
    const simulation = createTestSimulation({
      agents: [agent],
      foodSources: [foodSource],
    });

    const updatedSimulation = removeEntityAt(simulation, { x: 5, y: 6 });

    expect(updatedSimulation).to.equal(simulation);
  });

  it("does not remove anything outside the world bounds", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ agents: [agent] });

    const updatedSimulation = removeEntityAt(simulation, { x: 10, y: 2 });

    expect(updatedSimulation).to.equal(simulation);
  });
});

mocha.run();
