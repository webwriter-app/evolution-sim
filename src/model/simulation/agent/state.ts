import { Phenotype } from "../genetics/phenotype";
import { Vec2 } from "../position";

export interface AgentState {
  position: Vec2;
  currentEnergy: number;
}

export function getInitialAgentState({
  position,
  phenotype,
}: {
  position: Vec2;
  phenotype: Phenotype;
}): AgentState {
  return {
    position,
    currentEnergy: Math.floor(phenotype.energyCapacity * 0.5),
  };
}
