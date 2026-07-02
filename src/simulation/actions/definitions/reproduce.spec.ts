import { assert, describe, expect, it } from "vitest";
import { reproduceActionDefinition } from "./reproduce";
import { SIMULATION_WORLD_SIZE } from "@/simulation/constants";
import { AgentState } from "@/simulation/agent/state";
import { spawnAgent } from "@/simulation/agent/agent";
import { initializeGenome } from "@/simulation/genetics/genome";
import { ACTION_ERRORS } from "../actionErrors";

describe("reproduce action", () => {
  function buildAction() {
    return reproduceActionDefinition.buildAction({
      energyCapacity: 100,
      reproductionCost: 50,
      moveCost: 10,
      visionRange: 5,
    });
  }

  it("agent should be able to reproduce if it has enough energy", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 50,
    };

    const result = sut.execute(
      {
        worldSize: SIMULATION_WORLD_SIZE,
        me,
        foodSources: [],
        otherAgents: [],
        spawnAgent: () =>
          spawnAgent({
            position: me.position,
            genome: initializeGenome(),
            parentIds: [],
          }),
      },
      undefined as never,
    );

    assert(result.isOk());
    expect(result.value.me?.currentEnergy).toBe(0);
    expect(result.value.otherAgents?.length).toBe(1);
    expect(result.value.otherAgents?.[0]?.state.position).toEqual(me.position);
  });

  it("agent should not be able to reproduce if it does not have enough energy", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 0,
    };

    const result = sut.execute(
      {
        worldSize: SIMULATION_WORLD_SIZE,
        me,
        foodSources: [],
        otherAgents: [],
        spawnAgent: () =>
          spawnAgent({
            position: me.position,
            genome: initializeGenome(),
            parentIds: [],
          }),
      },
      undefined as never,
    );

    assert(result.isErr());
    expect(result.error).toBe(ACTION_ERRORS.ERR_NOT_ENOUGH_ENERGY);
  });
});
