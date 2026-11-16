import { Vec2 } from "./position";

export const AGENT_REPRODUCTION_COST = 20;
export const AGENT_MOVE_COST = 1;

export const MAX_ENERGY_CAPACITY = 100;
export const DEFAULT_ENERGY_CAPACITY = 30;

export const FOOD_BASE_ENERGY_GAIN_FROM_CONSUMPTION = 15;
export const FOOD_RECOVERY_RATE = 10;

export const MAX_VISION_RANGE = 10;
export const DEFAULT_VISION_RANGE = 4;

export const SIMULATION_WORLD_SIZE: Vec2 = { x: 50, y: 25 };
export const SIMULATION_FOOD_AMOUNT = 20;
export const SIMULATION_INITIAL_AGENT_COUNT = 5;

export const DEFAULT_MUTATION_RATE = 0.3;
