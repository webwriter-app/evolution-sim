import { FoodSource } from "./food-source/index";
import { AgentState } from "./agent/state";
import { Agent } from "./agent/agent";
import { Vec2 } from "./position";

export interface AgentContext {
  me: AgentState;
  worldSize: Vec2;
  otherAgents: Agent[];
  foodSources: FoodSource[];
  spawnAgent: () => Agent;
}
