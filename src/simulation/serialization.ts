import { Agent } from "./agent/agent";
import { AgentState } from "./agent/state";
import { FoodSource } from "./foodSource";
import { Genome } from "./genetics/genome";
import { Phenotype } from "./genetics/phenotype";
import { Vec2 } from "./position";
import { Simulation } from "./running";

export interface AgentSnapshot {
  id: string;
  parentIds: string[];
  state: AgentState;
  phenotype: Phenotype;
  genome: Genome;
}

function recordAgentSnapshot(agent: Agent): AgentSnapshot {
  return {
    id: agent.id,
    parentIds: agent.parentIds,
    state: agent.state,
    phenotype: agent.phenotype,
    genome: agent.genome,
  };
}

function recordFoodSourceSnapshot(foodSource: FoodSource): FoodSourceSnapshot {
  return {
    id: foodSource.id,
    position: foodSource.position,
    ticksTillRecovery: foodSource.ticksTillRecovery,
  };
}

export interface FoodSourceSnapshot {
  id: string;
  position: Vec2;
  ticksTillRecovery: number;
}

export type EntitySnapshot = AgentSnapshot | FoodSourceSnapshot;

export function recordSimulationSnapshot(
  tick: number,
  simulation: Simulation,
): SimulationSnapshot {
  return {
    tick,
    agents: simulation.agents.map(recordAgentSnapshot),
    foodSources: simulation.foodSources.map(recordFoodSourceSnapshot),
  };
}

export interface SimulationSnapshot {
  tick: number;
  agents: AgentSnapshot[];
  foodSources: FoodSourceSnapshot[];
}
