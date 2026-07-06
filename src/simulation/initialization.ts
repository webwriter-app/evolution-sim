import { Agent, spawnAgent } from "./agent/agent";
import { FoodSource, spawnFoodSource } from "./foodSource";
import { initializeGenome } from "./genetics/genome";
import { getUniqueRandomPositions, Vec2 } from "./position";
import { Simulation } from "./running";

function spawnNewAgents({
  worldSize,
  amount,
}: {
  worldSize: Vec2;
  amount: number;
}): Agent[] {
  const spawnPositions = getUniqueRandomPositions({
    amount,
    max: worldSize,
  });

  return spawnPositions.map((position) =>
    spawnAgent({ position, genome: initializeGenome(), parentIds: [] }),
  );
}

function spawnNewFoodSources({
  worldSize,
  amount,
}: {
  worldSize: Vec2;
  amount: number;
}): FoodSource[] {
  const sourcePositions = getUniqueRandomPositions({
    amount,
    max: worldSize,
  });

  return sourcePositions.map((position) => spawnFoodSource({ position }));
}

export function initializeSimulation({
  worldSize,
  initialAgentsAmount,
  initialFoodSourcesAmount,
  mutationRate,
}: {
  worldSize: Vec2;
  initialAgentsAmount: number;
  initialFoodSourcesAmount: number;
  mutationRate: number;
}): Simulation {
  const agents = spawnNewAgents({
    worldSize,
    amount: initialAgentsAmount,
  });

  const foodSources = spawnNewFoodSources({
    worldSize,
    amount: initialFoodSourcesAmount,
  });

  return {
    metadata: {
      worldSize,
      mutationRate,
    },
    agents,
    foodSources,
  };
}
