import { SimulationMetadata } from "@/simulation/running";
import { AgentSnapshot, SimulationSnapshot } from "@/simulation/serialization";
import { computed, signal } from "@lit-labs/signals";
import * as Comlink from "comlink";
import { first, isEqual } from "lodash-es";
import { createContext } from "@lit/context";

import SimulationWorkerRaw from "worker:../simulation/Simulation.worker";
import {
  SimulationRunner,
  SimulationInitOptions,
} from "../simulation/Simulation.worker";
import { hasNoValue, hasValue } from "@/utils/typeGuards";
import { Vec2 } from "@/simulation/position";
import { createDndStore } from "./useDnd";
import { signalArray } from "signal-utils/array";
import {
  EntitySelection,
  EntityType,
  extractAgentSelectionFromHistory,
  extractFoodSourceSelectionFromHistory,
} from "@/widgets/utils/entityInspection";
import {
  getImmediateAgentAncestry as computeImmediateAgentAncestry,
  ImmediateAgentAncestry,
} from "@/widgets/utils/agentAncestry";

export type ManualSimulationTool =
  "add-food-source" | "add-agent" | "remove-entity";

export type SimulationStatus =
  "uninitialized" | "ready" | "running" | "paused" | "completed";

const DEFAULT_TICK_INTERVAL = 100;

let simulationWorkerUrl: string | null = null;

function getSimulationWorkerUrl() {
  simulationWorkerUrl ??= URL.createObjectURL(
    new Blob([SimulationWorkerRaw], {
      type: "application/javascript",
    }),
  );

  return simulationWorkerUrl;
}

function createSimulationWorker() {
  const worker = new Worker(getSimulationWorkerUrl(), {
    type: "module",
  });

  return { worker, runner: Comlink.wrap<SimulationRunner>(worker) };
}

export function createSimulationStore() {
  let workerInstance: ReturnType<typeof createSimulationWorker> | null = null;

  function getWorker() {
    if (hasNoValue(workerInstance)) {
      workerInstance = createSimulationWorker();
      void workerInstance.runner.setTickInterval(
        DEFAULT_TICK_INTERVAL / simulationSpeed.get(),
      );
    }

    return workerInstance.runner;
  }

  const simulationMetadata = signal<SimulationMetadata | null>(null);
  const currentSnapshot = signal<SimulationSnapshot | null>(null);
  const simulationHistory = signalArray<SimulationSnapshot>([]);
  const simulationStatus = signal<SimulationStatus>("uninitialized");
  const simulationSpeed = signal(1);
  const manualToolDnd = createDndStore<ManualSimulationTool>();
  const activeManualTool = signal<ManualSimulationTool | null>(null);
  const isRunning = computed(() => simulationStatus.get() === "running");

  const currentSelection = signal<EntitySelection | null>(null);

  const latestAgentSnapshots = new Map<string, AgentSnapshot>();
  const childIdsByParentId = new Map<string, string[]>();
  const lineageVersion = signal(0);

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

  function clearSelection() {
    currentSelection.set(null);
  }

  function markSelectionRemoved(selection: EntitySelection, tick: number) {
    if (!hasValue(selection.removedAtTick)) {
      currentSelection.set({ ...selection, removedAtTick: tick });
    }
  }

  function refreshCurrentSelection(snapshot: SimulationSnapshot) {
    const selection = currentSelection.get();

    if (!hasValue(selection)) {
      return;
    }

    if (selection.type === "agent") {
      const agent = snapshot.agents.find(
        (agent) => agent.id === selection.entityId,
      );

      if (!hasValue(agent)) {
        markSelectionRemoved(selection, snapshot.tick);
        return;
      }

      selection.history.push({ tick: snapshot.tick, snapshot: agent });
      currentSelection.set({ ...selection, latestSnapshot: agent });
    } else {
      const foodSource = snapshot.foodSources.find(
        (foodSource) => foodSource.id === selection.entityId,
      );

      if (!hasValue(foodSource)) {
        markSelectionRemoved(selection, snapshot.tick);
        return;
      }

      selection.history.push({ tick: snapshot.tick, snapshot: foodSource });
      currentSelection.set({ ...selection, latestSnapshot: foodSource });
    }
  }

  function updateLineageIndex(snapshot: SimulationSnapshot) {
    let hasNewAgents = false;

    for (const agent of snapshot.agents) {
      if (!latestAgentSnapshots.has(agent.id)) {
        hasNewAgents = true;

        for (const parentId of agent.parentIds ?? []) {
          const childIds = childIdsByParentId.get(parentId);

          if (hasValue(childIds)) {
            childIds.push(agent.id);
          } else {
            childIdsByParentId.set(parentId, [agent.id]);
          }
        }
      }

      latestAgentSnapshots.set(agent.id, agent);
    }

    if (hasNewAgents) {
      lineageVersion.set(lineageVersion.get() + 1);
    }
  }

  function clearHistory() {
    simulationHistory.splice(0, simulationHistory.length);
    latestAgentSnapshots.clear();
    childIdsByParentId.clear();
    lineageVersion.set(lineageVersion.get() + 1);
    currentSelection.set(null);
  }

  function updateCurrentSnapshot(snapshot: SimulationSnapshot) {
    currentSnapshot.set(snapshot);
    simulationHistory.push(snapshot);
    updateLineageIndex(snapshot);
    refreshCurrentSelection(snapshot);
  }

  function getImmediateAgentAncestry(
    agentId: string,
  ): ImmediateAgentAncestry | null {
    lineageVersion.get();

    return computeImmediateAgentAncestry(
      agentId,
      latestAgentSnapshots,
      childIdsByParentId,
    );
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

    await getWorker().stopSimulation();
    const initResult = await getWorker().initializeNewSimulation(options);

    simulationMetadata.set(initResult.metadata);
    clearHistory();
    updateCurrentSnapshot(initResult.initialSnapshot);
    simulationStatus.set("ready");
  }

  async function runNextTick() {
    if (isRunning.get() || !hasValue(currentSnapshot.get())) {
      return;
    }

    const tickResult = await getWorker().runTick();

    updateCurrentSnapshot(tickResult);
    simulationStatus.set("paused");
  }

  async function addFoodSource(position: Vec2) {
    if (!hasValue(currentSnapshot.get())) {
      return;
    }

    const snapshot = await getWorker().addFoodSource(position);
    updateCurrentSnapshot(snapshot);
  }

  async function addAgent(position: Vec2) {
    if (!hasValue(currentSnapshot.get())) {
      return;
    }

    const snapshot = await getWorker().addAgent(position);
    updateCurrentSnapshot(snapshot);
  }

  async function removeEntityAt(position: Vec2) {
    if (!hasValue(currentSnapshot.get())) {
      return;
    }

    const snapshot = await getWorker().removeEntityAt(position);
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
      await getWorker().startSimulation(
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
    await workerInstance?.runner.stopSimulation();
  }

  async function resetSimulation() {
    try {
      const { initialSnapshot, metadata } = await getWorker().resetSimulation();
      simulationMetadata.set(metadata);
      clearHistory();
      updateCurrentSnapshot(initialSnapshot);
      simulationStatus.set("ready");
    } catch (error) {
      console.error("ERROR - Failed to reset simulation", error);
    }
  }

  async function setSimulationSpeed(speed: number) {
    simulationSpeed.set(speed);
    await workerInstance?.runner.setTickInterval(DEFAULT_TICK_INTERVAL / speed);
  }

  async function setMutationRate(mutationRate: number) {
    if (!hasValue(currentSnapshot.get())) {
      return;
    }

    const metadata = await getWorker().setMutationRate(mutationRate);
    simulationMetadata.set(metadata);
  }

  function dispose() {
    if (hasNoValue(workerInstance)) {
      return;
    }

    workerInstance.runner[Comlink.releaseProxy]();
    workerInstance.worker.terminate();
    workerInstance = null;

    simulationMetadata.set(null);
    currentSnapshot.set(null);
    clearHistory();
    activeManualTool.set(null);
    simulationStatus.set("uninitialized");
  }

  return {
    dispose,
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
    clearSelection,
    getImmediateAgentAncestry,
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

export type SimulationStore = ReturnType<typeof createSimulationStore>;

export const simulationStoreContext = createContext<SimulationStore>(
  Symbol("simulation-store"),
);
