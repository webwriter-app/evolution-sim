import {
  FOOD_BASE_ENERGY_GAIN_FROM_CONSUMPTION,
  FOOD_RECOVERY_RATE,
} from "../constants";
import { Vec2 } from "../position";

export interface FoodSource {
  id: string;
  position: Vec2;
  recoveryRate: number;
  ticksTillRecovery: number;

  baseEnergyGainFromConsumption: number;
}

export function spawnFoodSource({ position }: { position: Vec2 }): FoodSource {
  return {
    id: crypto.randomUUID(),
    position,
    recoveryRate: FOOD_RECOVERY_RATE,
    ticksTillRecovery: 0,
    baseEnergyGainFromConsumption: FOOD_BASE_ENERGY_GAIN_FROM_CONSUMPTION,
  };
}
