import { SimulationMetadata } from "@/simulation/running";
import { SimulationSnapshot } from "@/simulation/serialization";
import { computed, signal } from "@lit-labs/signals";
import * as Comlink from "comlink";
import { first, isEqual } from "lodash-es";

import SimulationWorkerRaw from "worker:../simulation/Simulation.worker";
import {
  SimulationRunner,
  SimulationInitOptions,
} from "../simulation/Simulation.worker";
import { hasValue } from "@/utils/typeGuards";
import { Vec2 } from "@/simulation/position";
import { createDndStore } from "./useDnd";
import { signalArray } from "signal-utils/array";
import {
  EntitySelection,
  EntityType,
  extractAgentSelectionFromHistory,
  extractFoodSourceSelectionFromHistory,
} from "@/widgets/utils/entityInspection";

export type ManualSimulationTool =
  | "add-food-source"
  | "add-agent"
  | "remove-entity";

export type SimulationStatus =
  | "uninitialized"
  | "ready"
  | "running"
  | "paused"
  | "completed";

const SimulationWorker = Comlink.wrap<SimulationRunner>(
  new Worker(
    URL.createObjectURL(
      new Blob([SimulationWorkerRaw], {
        type: "application/javascript",
      }),
    ),
    {
      type: "module",
    },
  ),
);

const simulationMetadata = signal<SimulationMetadata | null>(null);
const currentSnapshot = signal<SimulationSnapshot | null>(null);
const simulationHistory = signalArray<SimulationSnapshot>([]);
const simulationStatus = signal<SimulationStatus>("uninitialized");
const simulationSpeed = signal(1);
const manualToolDnd = createDndStore<ManualSimulationTool>();
const activeManualTool = signal<ManualSimulationTool | null>(null);
const isRunning = computed(() => simulationStatus.get() === "running");
const DEFAULT_TICK_INTERVAL = 100;

const currentSelection = signal<EntitySelection | null>(null);

function selectEntityAt(position: Vec2) {
  const snapshot = currentSnapshot.get();

  if (!hasValue(snapshot)) {
    return;
  }

  const entitiesAtPosition = [
    ...snapshot.agents.filter((agent) =>
      isEqual(agent.state.position, position),
    ),
    ...snapshot.foodSources.filter((foodSource) =>
      isEqual(foodSource.position, position),
    ),
  ];

  const topEntityAtPosition = first(entitiesAtPosition);

  if (hasValue(topEntityAtPosition)) {
    const entityType: EntityType = snapshot.agents.some(
      (agent) => agent.id === topEntityAtPosition.id,
    )
      ? "agent"
      : "foodSource";
    console.log(
      `INFO - selecting entity at position, ${JSON.stringify(position)}, selected entity:`,
      topEntityAtPosition,
    );

    selectEntity({ entityId: topEntityAtPosition.id, entityType });
  }
}

function selectEntity({
  entityId,
  entityType,
}: {
  entityId: string;
  entityType: EntityType;
}) {
  const selection =
    entityType === "agent"
      ? extractAgentSelectionFromHistory(entityId, simulationHistory)
      : extractFoodSourceSelectionFromHistory(entityId, simulationHistory);

  currentSelection.set(selection);
}

function refreshCurrentSelection() {
  const selection = currentSelection.get();

  if (!hasValue(selection)) {
    return;
  }

  selectEntity({
    entityId: selection.entityId,
    entityType: selection.type,
  });
}

function updateCurrentSnapshot(snapshot: SimulationSnapshot) {
  currentSnapshot.set(snapshot);
  simulationHistory.push(snapshot);
  refreshCurrentSelection();
}

const currentActiveSimulationData = computed(() => {
  const metadata = simulationMetadata.get();
  const snapshot = currentSnapshot.get();

  if (hasValue(metadata) && hasValue(snapshot)) {
    return {
      metadata,
      snapshot,
      currentTick: snapshot.tick,
    };
  } else {
    return null;
  }
});

async function initializeNewSimulation(options: SimulationInitOptions) {
  console.log("INFO - initialized new simulation with options", options);

  await SimulationWorker.stopSimulation();
  const initResult = await SimulationWorker.initializeNewSimulation(options);

  simulationMetadata.set(initResult.metadata);
  simulationHistory.splice(0, simulationHistory.length);
  currentSelection.set(null);
  updateCurrentSnapshot(initResult.initialSnapshot);
  simulationStatus.set("ready");
}

async function runNextTick() {
  if (isRunning.get() || !hasValue(currentSnapshot.get())) {
    return;
  }

  const tickResult = await SimulationWorker.runTick();

  updateCurrentSnapshot(tickResult);
  simulationStatus.set("paused");
}

async function addFoodSource(position: Vec2) {
  if (!hasValue(currentSnapshot.get())) {
    return;
  }

  const snapshot = await SimulationWorker.addFoodSource(position);
  updateCurrentSnapshot(snapshot);
}

async function addAgent(position: Vec2) {
  if (!hasValue(currentSnapshot.get())) {
    return;
  }

  const snapshot = await SimulationWorker.addAgent(position);
  updateCurrentSnapshot(snapshot);
}

async function removeEntityAt(position: Vec2) {
  if (!hasValue(currentSnapshot.get())) {
    return;
  }

  const snapshot = await SimulationWorker.removeEntityAt(position);
  updateCurrentSnapshot(snapshot);
}

function setActiveManualTool(tool: ManualSimulationTool | null) {
  activeManualTool.set(tool);
}

function toggleActiveManualTool(tool: ManualSimulationTool) {
  activeManualTool.set(activeManualTool.get() === tool ? null : tool);
}

async function startSimulation() {
  if (!isRunning.get() && hasValue(currentSnapshot.get())) {
    simulationStatus.set("running");
    await SimulationWorker.startSimulation(
      Comlink.proxy((snapshot) => {
        updateCurrentSnapshot(snapshot);
      }),
    );
  }
}

async function stopSimulation() {
  simulationStatus.set(
    hasValue(currentSnapshot.get()) ? "paused" : "uninitialized",
  );
  await SimulationWorker.stopSimulation();
}

async function resetSimulation() {
  try {
    const { initialSnapshot, metadata } =
      await SimulationWorker.resetSimulation();
    simulationMetadata.set(metadata);
    simulationHistory.splice(0, simulationHistory.length);
    currentSelection.set(null);
    updateCurrentSnapshot(initialSnapshot);
    simulationStatus.set("ready");
  } catch (error) {
    console.error("ERROR - Failed to reset simulation", error);
  }
}

async function setSimulationSpeed(speed: number) {
  simulationSpeed.set(speed);
  await SimulationWorker.setTickInterval(DEFAULT_TICK_INTERVAL / speed);
}

async function setMutationRate(mutationRate: number) {
  if (!hasValue(currentSnapshot.get())) {
    return;
  }

  const metadata = await SimulationWorker.setMutationRate(mutationRate);
  simulationMetadata.set(metadata);
}

export function useSimulationStore() {
  return {
    initializeNewSimulation,
    addFoodSource,
    addAgent,
    removeEntityAt,
    runNextTick,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setSimulationSpeed,
    setMutationRate,
    selectEntity,
    selectEntityAt,
    currentSelection,
    simulationHistory,
    currentActiveSimulationData,
    simulationStatus,
    simulationSpeed,
    manualToolDnd,
    activeManualTool,
    setActiveManualTool,
    toggleActiveManualTool,
    isRunning,
  };
}
