import { assert, describe, expect, it } from "vitest";
import {
  addAgent,
  addFoodSource,
  removeEntityAt,
  runSimulation,
  Simulation,
} from "./running";
import { spawnAgent } from "./agent/agent";
import { AgentState } from "./agent/state";
import { VEC_0 } from "./position";
import { FoodSource } from "./foodSource";
import { first } from "lodash-es";
import { hasValue } from "@/utils/typeGuards";
import { initializeGenome } from "./genetics/genome";

describe("running simulation", () => {
  function createTestAgent(state: Partial<AgentState>) {
    const defaultState: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 100,
    };

    const agent = spawnAgent({
      position: VEC_0,
      genome: initializeGenome(),
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

    expect(updatedSimulation.agents).toHaveLength(0);
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

    const updatedFoodSource = first(updatedSimulation.foodSources);

    assert(hasValue(updatedFoodSource));
    expect(updatedFoodSource.ticksTillRecovery).toBe(testTicksTillRecovery - 1);
  });

  it("adds a food source at a valid position", () => {
    const position = { x: 1, y: 2 };
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, position);

    expect(updatedSimulation.foodSources).toHaveLength(1);
    expect(updatedSimulation.foodSources[0]?.position).toEqual(position);
  });

  it("does not add a food source outside negative bounds", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, { x: -1, y: 0 });

    expect(updatedSimulation.foodSources).toHaveLength(0);
  });

  it("does not add a food source outside the world size", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, { x: 10, y: 0 });

    expect(updatedSimulation.foodSources).toHaveLength(0);
  });

  it("does not add a food source at a non-integer position", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addFoodSource(simulation, { x: 1.5, y: 0 });

    expect(updatedSimulation.foodSources).toHaveLength(0);
  });

  it("does not add a food source at an occupied food source position", () => {
    const foodSource = createTestFoodSource({
      position: { x: 1, y: 2 },
    });
    const simulation = createTestSimulation({ foodSources: [foodSource] });

    const updatedSimulation = addFoodSource(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.foodSources).toHaveLength(1);
  });

  it("adds an agent at a valid position with a default genome", () => {
    const position = { x: 1, y: 2 };
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, position);

    expect(updatedSimulation.agents).toHaveLength(1);
    expect(updatedSimulation.agents[0]?.state.position).toEqual(position);
    expect(updatedSimulation.agents[0]?.genome).toEqual(initializeGenome());
  });

  it("does not add an agent outside negative bounds", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, { x: -1, y: 0 });

    expect(updatedSimulation.agents).toHaveLength(0);
  });

  it("does not add an agent outside the world size", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, { x: 10, y: 0 });

    expect(updatedSimulation.agents).toHaveLength(0);
  });

  it("does not add an agent at a non-integer position", () => {
    const simulation = createTestSimulation({});

    const updatedSimulation = addAgent(simulation, { x: 1.5, y: 0 });

    expect(updatedSimulation.agents).toHaveLength(0);
  });

  it("does not add an agent at an occupied agent position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ agents: [agent] });

    const updatedSimulation = addAgent(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).toHaveLength(1);
  });

  it("removes a food source at a position", () => {
    const foodSource = createTestFoodSource({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ foodSources: [foodSource] });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.foodSources).toHaveLength(0);
  });

  it("removes an agent at a position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ agents: [agent] });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).toHaveLength(0);
  });

  it("removes only one entity at a position", () => {
    const firstAgent = createTestAgent({ position: { x: 1, y: 2 } });
    const secondAgent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({
      agents: [firstAgent, secondAgent],
    });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).toHaveLength(1);
    expect(updatedSimulation.agents[0]?.id).toBe(secondAgent.id);
  });

  it("prefers removing an agent over a food source at the same position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const foodSource = createTestFoodSource({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({
      agents: [agent],
      foodSources: [foodSource],
    });

    const updatedSimulation = removeEntityAt(simulation, { x: 1, y: 2 });

    expect(updatedSimulation.agents).toHaveLength(0);
    expect(updatedSimulation.foodSources).toHaveLength(1);
  });

  it("does not remove anything at an empty position", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const foodSource = createTestFoodSource({ position: { x: 3, y: 4 } });
    const simulation = createTestSimulation({
      agents: [agent],
      foodSources: [foodSource],
    });

    const updatedSimulation = removeEntityAt(simulation, { x: 5, y: 6 });

    expect(updatedSimulation).toBe(simulation);
  });

  it("does not remove anything outside the world bounds", () => {
    const agent = createTestAgent({ position: { x: 1, y: 2 } });
    const simulation = createTestSimulation({ agents: [agent] });

    const updatedSimulation = removeEntityAt(simulation, { x: 10, y: 2 });

    expect(updatedSimulation).toBe(simulation);
  });
});
