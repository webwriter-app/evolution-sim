import { assert, describe, expect, it } from "vitest";
import { eatActionDefinition } from "./eat";
import { AgentState } from "@/simulation/agent/state";
import { VEC_0 } from "@/simulation/position";
import { SIMULATION_WORLD_SIZE } from "@/simulation/constants";
import { FoodSource } from "@/simulation/foodSource";
import { first } from "lodash-es";
import { uid } from "uid";
import { ACTION_ERRORS } from "../actionErrors";
import { AgentContext } from "@/simulation/agentContext";

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
      id: uid(),
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
    expect(result.value.me?.currentEnergy).toBeGreaterThan(0);
    expect(first(result.value.foodSources)?.ticksTillRecovery).toBeGreaterThan(
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
      id: uid(),
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
    expect(result.error).toBe(ACTION_ERRORS.ERR_NOT_IN_RANGE);
  });

  it("agent should not be able to eat from a food source if it is not recovered", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: VEC_0,
      currentEnergy: 0,
    };
    const foodSource: FoodSource = {
      id: uid(),
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
    expect(result.error).toBe(ACTION_ERRORS.ERR_RESOURCE_UNAVAILABLE);
  });

  it("agent should put the food source in recovery after eating", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: VEC_0,
      currentEnergy: 0,
    };
    const foodSource: FoodSource = {
      id: uid(),
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
    expect(first(result.value.foodSources)?.ticksTillRecovery).toBe(
      foodSource.recoveryRate,
    );
  });
});
