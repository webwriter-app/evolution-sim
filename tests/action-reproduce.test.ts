/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert, expect } from "chai";
import { getMochaConfig } from "@webwriter/build/test";

import { reproduceActionDefinition } from "../src/model/simulation/actions/definitions/reproduce";
import { SIMULATION_WORLD_SIZE } from "../src/model/simulation/constants";
import { AgentState } from "../src/model/simulation/agent/state";
import { spawnAgent } from "../src/model/simulation/agent/agent";
import { initializeGenome } from "../src/model/simulation/genetics/genome";
import { ACTION_ERRORS } from "../src/model/simulation/actions/action-errors";

mocha.setup(getMochaConfig());

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
    expect(result.value.me?.currentEnergy).to.equal(0);
    expect(result.value.otherAgents?.length).to.equal(1);
    expect(result.value.otherAgents?.[0]?.state.position).to.deep.equal(me.position);
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
    expect(result.error).to.equal(ACTION_ERRORS.ERR_NOT_ENOUGH_ENERGY);
  });
});

mocha.run();
