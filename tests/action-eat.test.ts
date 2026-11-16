/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert, expect } from "chai";
import { getMochaConfig } from "@webwriter/build/test";

import { eatActionDefinition } from "../src/model/simulation/actions/definitions/eat";
import { AgentState } from "../src/model/simulation/agent/state";
import { VEC_0 } from "../src/model/simulation/position";
import { SIMULATION_WORLD_SIZE } from "../src/model/simulation/constants";
import { FoodSource } from "../src/model/simulation/food-source";
import { ACTION_ERRORS } from "../src/model/simulation/actions/action-errors";
import { AgentContext } from "../src/model/simulation/agent-context";

mocha.setup(getMochaConfig());

describe("eat action", () => {
  function buildAction() {
    return eatActionDefinition.buildAction({
      energyCapacity: 100,
      reproductionCost: 50,
      moveCost: 10,
      visionRange: 5,
    });
  }

  function createContext(
    overrides: Partial<AgentContext> & Pick<AgentContext, "me">,
  ): AgentContext {
    return {
      worldSize: SIMULATION_WORLD_SIZE,
      foodSources: [],
      otherAgents: [],
      spawnAgent: () => {
        throw new Error("Eat action should not spawn agents");
      },
      ...overrides,
    };
  }

  it("agent should be able to eat from a food source and gain energy if it is in range", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: VEC_0,
      currentEnergy: 0,
    };
    const foodSource: FoodSource = {
      id: crypto.randomUUID(),
      position: VEC_0,
      baseEnergyGainFromConsumption: 25,
      recoveryRate: 5,
      ticksTillRecovery: 0,
    };

    const result = sut.execute(
      createContext({ me, foodSources: [foodSource] }),
      foodSource,
    );

    assert(result.isOk());
    expect(result.value.me?.currentEnergy).to.be.greaterThan(0);
    expect(result.value.foodSources?.at(0)?.ticksTillRecovery).to.be.greaterThan(
      0,
    );
  });

  it("agent should not be able to eat from a food source if it is not in range", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: VEC_0,
      currentEnergy: 0,
    };
    const foodSource: FoodSource = {
      id: crypto.randomUUID(),
      position: { x: 1, y: 1 },
      baseEnergyGainFromConsumption: 25,
      recoveryRate: 5,
      ticksTillRecovery: 0,
    };

    const result = sut.execute(
      createContext({ me, foodSources: [foodSource] }),
      foodSource,
    );

    assert(result.isErr());
    expect(result.error).to.equal(ACTION_ERRORS.ERR_NOT_IN_RANGE);
  });

  it("agent should not be able to eat from a food source if it is not recovered", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: VEC_0,
      currentEnergy: 0,
    };
    const foodSource: FoodSource = {
      id: crypto.randomUUID(),
      position: VEC_0,
      baseEnergyGainFromConsumption: 25,
      recoveryRate: 5,
      ticksTillRecovery: 3,
    };

    const result = sut.execute(
      createContext({ me, foodSources: [foodSource] }),
      foodSource,
    );

    assert(result.isErr());
    expect(result.error).to.equal(ACTION_ERRORS.ERR_RESOURCE_UNAVAILABLE);
  });

  it("agent should put the food source in recovery after eating", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: VEC_0,
      currentEnergy: 0,
    };
    const foodSource: FoodSource = {
      id: crypto.randomUUID(),
      position: VEC_0,
      baseEnergyGainFromConsumption: 25,
      recoveryRate: 5,
      ticksTillRecovery: 0,
    };

    const result = sut.execute(
      createContext({ me, foodSources: [foodSource] }),
      foodSource,
    );

    assert(result.isOk());
    expect(result.value.foodSources?.at(0)?.ticksTillRecovery).to.equal(
      foodSource.recoveryRate,
    );
  });
});

mocha.run();
