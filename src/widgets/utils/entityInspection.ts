import {
  AgentSnapshot,
  FoodSourceSnapshot,
  SimulationSnapshot,
} from "@/simulation/serialization";
import { hasValue } from "@/utils/typeGuards";
import { last } from "lodash-es";

export interface AgentHistoryEntry {
  tick: number;
  snapshot: AgentSnapshot;
}

export interface FoodSourceHistoryEntry {
  tick: number;
  snapshot: FoodSourceSnapshot;
}

export interface AgentSelection {
  type: "agent";
  entityId: string;
  history: AgentHistoryEntry[];
  latestSnapshot: AgentSnapshot;
  removedAtTick: number | null;
}

export interface FoodSourceSelection {
  type: "foodSource";
  entityId: string;
  history: FoodSourceHistoryEntry[];
  latestSnapshot: FoodSourceSnapshot;
  removedAtTick: number | null;
}

export type EntitySelection = AgentSelection | FoodSourceSelection;
export type EntityType = "agent" | "foodSource";

function getRemovedAtTick(
  lastSeenTick: number,
  history: readonly SimulationSnapshot[],
): number | null {
  return history.find((snapshot) => snapshot.tick > lastSeenTick)?.tick ?? null;
}

export function extractAgentSelectionFromHistory(
  agentId: string,
  history: readonly SimulationSnapshot[],
): AgentSelection | null {
  const entityHistory = history
    .map((snapshot) => ({
      tick: snapshot.tick,
      snapshot: snapshot.agents.find((agent) => agent.id === agentId) ?? null,
    }))
    .filter((entry): entry is AgentHistoryEntry => hasValue(entry.snapshot));

  const latestEntry = last(entityHistory);

  if (!hasValue(latestEntry)) {
    return null;
  }

  return {
    type: "agent",
    entityId: agentId,
    history: entityHistory,
    latestSnapshot: latestEntry.snapshot,
    removedAtTick: getRemovedAtTick(latestEntry.tick, history),
  };
}

export function extractFoodSourceSelectionFromHistory(
  foodSourceId: string,
  history: readonly SimulationSnapshot[],
): FoodSourceSelection | null {
  const entityHistory = history
    .map((snapshot) => ({
      tick: snapshot.tick,
      snapshot:
        snapshot.foodSources.find(
          (foodSource) => foodSource.id === foodSourceId,
        ) ?? null,
    }))
    .filter((entry): entry is FoodSourceHistoryEntry =>
      hasValue(entry.snapshot),
    );

  const latestEntry = last(entityHistory);

  if (!hasValue(latestEntry)) {
    return null;
  }

  return {
    type: "foodSource",
    entityId: foodSourceId,
    history: entityHistory,
    latestSnapshot: latestEntry.snapshot,
    removedAtTick: getRemovedAtTick(latestEntry.tick, history),
  };
}
