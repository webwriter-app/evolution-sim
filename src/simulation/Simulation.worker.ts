import { hasNoValue, hasValue } from "@/utils/typeGuards";
import {
  addAgent,
  addFoodSource,
  removeEntityAt,
  runSimulation,
  Simulation,
  SimulationMetadata,
} from "./running";
import { recordSimulationSnapshot, SimulationSnapshot } from "./serialization";
import { initializeSimulation } from "./initialization";
import { Vec2 } from "./position";
import * as Comlink from "comlink";
import { setRandomSeed } from "@/utils/random";
import { cloneDeep } from "lodash-es";

export interface SimulationInitOptions {
  seed: string;
  worldSize: Vec2;
  initialAgentsAmount: number;
  initialFoodSourcesAmount: number;
  mutationRate: number;
}

export interface SimulationRunner {
  initializeNewSimulation: (simulationParameters: SimulationInitOptions) => {
    metadata: SimulationMetadata;
    initialSnapshot: SimulationSnapshot;
  };
  resetSimulation: () => {
    metadata: SimulationMetadata;
    initialSnapshot: SimulationSnapshot;
  };

  runTick: () => SimulationSnapshot;

  addFoodSource: (position: Vec2) => SimulationSnapshot;
  addAgent: (position: Vec2) => SimulationSnapshot;
  removeEntityAt: (position: Vec2) => SimulationSnapshot;

  startSimulation: (
    onTickFinished: (snapshot: SimulationSnapshot) => void | Promise<void>,
  ) => void;
  stopSimulation: () => void;
  setTickInterval: (intervalMs: number) => void;
  setMutationRate: (mutationRate: number) => SimulationMetadata;
}

const DEFAULT_TICK_INTERVAL = 100;

let seed: string | null = null;

let currentTick: number = -1;
let simulation: Simulation | null = null;
let initialSimulation: Simulation | null = null;

let runTimeoutId: number | null;
let runGeneration = 0;
let tickInterval = DEFAULT_TICK_INTERVAL;

function initializeNewSimulation(options: SimulationInitOptions) {
  console.log("INFO - Initializing new simulation with options", options);
  stopSimulation();
  seed = options.seed;
  setRandomSeed(seed);

  const newSimulation = initializeSimulation(options);
  simulation = newSimulation;
  currentTick = 0;
  initialSimulation = cloneDeep(newSimulation);

  return {
    metadata: newSimulation.metadata,
    initialSnapshot: recordSimulationSnapshot(currentTick, newSimulation),
  };
}

function resetSimulation() {
  if (hasNoValue(initialSimulation)) {
    throw new Error("No simulation to reset");
  }

  stopSimulation();
  setRandomSeed(seed ?? "");
  simulation = cloneDeep(initialSimulation);
  currentTick = 0;

  return {
    metadata: simulation.metadata,
    initialSnapshot: recordSimulationSnapshot(currentTick, simulation),
  };
}

function runSimulationTick() {
  if (hasNoValue(simulation) || currentTick < 0) {
    throw new Error("No active simulation to run");
  }

  const updatedSimulation = runSimulation(simulation);
  const updatedTick = currentTick + 1;

  simulation = updatedSimulation;
  currentTick = updatedTick;

  const snapshot = recordSimulationSnapshot(currentTick, simulation);

  return snapshot;
}

function addFoodSourceToSimulation(position: Vec2) {
  if (hasNoValue(simulation) || currentTick < 0) {
    throw new Error("No active simulation to edit");
  }

  simulation = addFoodSource(simulation, position);

  return recordSimulationSnapshot(currentTick, simulation);
}

function addAgentToSimulation(position: Vec2) {
  if (hasNoValue(simulation) || currentTick < 0) {
    throw new Error("No active simulation to edit");
  }

  simulation = addAgent(simulation, position);

  return recordSimulationSnapshot(currentTick, simulation);
}

function removeEntityAtPosition(position: Vec2) {
  if (hasNoValue(simulation) || currentTick < 0) {
    throw new Error("No active simulation to edit");
  }

  simulation = removeEntityAt(simulation, position);

  return recordSimulationSnapshot(currentTick, simulation);
}

function startSimulation(
  onTickFinished: (snapshot: SimulationSnapshot) => void | Promise<void>,
) {
  console.log("INFO - starting simulation");
  if (hasNoValue(simulation) || currentTick < 0) {
    throw new Error("No simulation to run");
  } else if (hasNoValue(runTimeoutId)) {
    const generation = ++runGeneration;

    const runNextTick = async () => {
      console.log("INFO - running next tick");
      const snapshot = runSimulationTick();
      await onTickFinished(snapshot);

      if (generation === runGeneration) {
        runTimeoutId = setTimeout(runNextTick, tickInterval);
      }
    };

    runTimeoutId = setTimeout(runNextTick, tickInterval);
  }
}

function stopSimulation() {
  runGeneration++;
  if (hasValue(runTimeoutId)) {
    clearTimeout(runTimeoutId);
    runTimeoutId = null;
  }
}

function setTickInterval(intervalMs: number) {
  tickInterval = Math.max(1, intervalMs);
}

function setMutationRate(mutationRate: number): SimulationMetadata {
  if (hasNoValue(simulation)) {
    throw new Error("No active simulation to update");
  }

  const updatedMetadata = {
    ...simulation.metadata,
    mutationRate,
  };

  simulation = {
    ...simulation,
    metadata: updatedMetadata,
  };

  return updatedMetadata;
}

export const SimulationRunner: SimulationRunner = {
  initializeNewSimulation,
  resetSimulation,
  startSimulation,
  stopSimulation,
  setTickInterval,
  setMutationRate,
  addFoodSource: addFoodSourceToSimulation,
  addAgent: addAgentToSimulation,
  removeEntityAt: removeEntityAtPosition,
  runTick() {
    if (hasValue(runTimeoutId)) {
      throw new Error(
        "Manually progressing the simulation, while running is forbidden",
      );
    } else {
      return runSimulationTick();
    }
  },
};

Comlink.expose(SimulationRunner);
