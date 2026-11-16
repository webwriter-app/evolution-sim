/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert, expect } from "chai";
import { getMochaConfig } from "@webwriter/build/test";

import { moveActionDefinition } from "../src/model/simulation/actions/definitions/move";
import { Directions } from "../src/model/simulation/position";
import { SIMULATION_WORLD_SIZE } from "../src/model/simulation/constants";
import { AgentState } from "../src/model/simulation/agent/state";
import { ACTION_ERRORS } from "../src/model/simulation/actions/action-errors";
import { spawnAgent } from "../src/model/simulation/agent/agent";
import { initializeGenome } from "../src/model/simulation/genetics/genome";
import { err } from "../src/model/result";
import { AgentContext } from "../src/model/simulation/agent-context";

mocha.setup(getMochaConfig());

describe("move action", () => {
  function buildAction() {
    return moveActionDefinition.buildAction({
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
        throw new Error("Move action should not spawn agents");
      },
      ...overrides,
    };
  }

  it("agent is able to move to a new position if it has enough energy", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 20,
    };

    const result = sut.execute(createContext({ me }), Directions.Down);

    assert(result.isOk());
    expect(result.value.me?.position).to.deep.equal({ x: 0, y: 1 });
    expect(result.value.me?.currentEnergy).to.equal(10);
  });

  it("agent should not be able to move if it does not have enough energy", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 0,
    };

    const result = sut.execute(createContext({ me }), Directions.Down);

    assert(result.isErr());
    expect(result.error).to.equal(ACTION_ERRORS.ERR_NOT_ENOUGH_ENERGY);
  });

  it("agent should not be able to move up outside of the world boundaries", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: {
        x: 0,
        y: 0,
      },
      currentEnergy: 100,
    };

    const result = sut.execute(
      createContext({
        worldSize: {
          x: 1,
          y: 1,
        },
        me,
      }),
      Directions.Up,
    );

    expect(result).to.deep.equal(err(ACTION_ERRORS.ERR_OUT_OF_BOUNDS));
  });

  it("agent should not be able to move down outside of the world boundaries", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: {
        x: 0,
        y: 0,
      },
      currentEnergy: 100,
    };

    const result = sut.execute(
      createContext({
        worldSize: {
          x: 1,
          y: 1,
        },
        me,
      }),
      Directions.Down,
    );

    expect(result).to.deep.equal(err(ACTION_ERRORS.ERR_OUT_OF_BOUNDS));
  });

  it("agent should not be able to move left outside of the world boundaries", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: {
        x: 0,
        y: 0,
      },
      currentEnergy: 100,
    };

    const result = sut.execute(
      createContext({
        worldSize: {
          x: 1,
          y: 1,
        },
        me,
      }),
      Directions.Left,
    );

    expect(result).to.deep.equal(err(ACTION_ERRORS.ERR_OUT_OF_BOUNDS));
  });

  it("agent should not be able to move right outside of the world boundaries", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: {
        x: 0,
        y: 0,
      },
      currentEnergy: 100,
    };

    const result = sut.execute(
      createContext({
        worldSize: {
          x: 1,
          y: 1,
        },
        me,
      }),
      Directions.Right,
    );

    expect(result).to.deep.equal(err(ACTION_ERRORS.ERR_OUT_OF_BOUNDS));
  });

  it("agent should not be able to move to a position occupied by another agent", () => {
    const sut = buildAction();
    const me: AgentState = {
      position: { x: 0, y: 0 },
      currentEnergy: 100,
    };
    const otherAgent = spawnAgent({
      position: { x: 0, y: 1 },
      genome: initializeGenome(),
      parentIds: [],
    });

    const result = sut.execute(
      createContext({ me, otherAgents: [otherAgent] }),
      Directions.Down,
    );

    assert(result.isErr());
    expect(result.error).to.equal(ACTION_ERRORS.ERR_POSITION_OCCUPIED);
  });
});

mocha.run();
