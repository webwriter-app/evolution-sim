import { hasValue } from "@/utils/typeGuards";
import type { SimulationConfiguration } from "../simulation-pre-configuration-aside";

type InitOptions = Partial<SimulationConfiguration["initOptions"]>;

export type InitOptionField =
  | "worldSize.x"
  | "worldSize.y"
  | "initialAgentsAmount"
  | "initialFoodSourcesAmount"
  | "mutationRate";

export interface InitOptionBounds {
  min: number;
  max?: number;
  step: number;
  integer: boolean;
}

const WORLD_SIZE_BOUNDS: InitOptionBounds = { min: 1, step: 1, integer: true };

function isWithinBounds(value: number, bounds: InitOptionBounds) {
  return (
    Number.isFinite(value) &&
    value >= bounds.min &&
    value <= (bounds.max ?? Infinity) &&
    (!bounds.integer || Number.isInteger(value))
  );
}

export function getInitOptionBounds(
  initOptions: InitOptions,
): Record<InitOptionField, InitOptionBounds> {
  const worldSize = initOptions.worldSize?.value;
  const tileCount =
    hasValue(worldSize) &&
    isWithinBounds(worldSize.x, WORLD_SIZE_BOUNDS) &&
    isWithinBounds(worldSize.y, WORLD_SIZE_BOUNDS)
      ? worldSize.x * worldSize.y
      : undefined;
  const entityAmountBounds = { min: 0, max: tileCount, step: 1, integer: true };

  return {
    "worldSize.x": WORLD_SIZE_BOUNDS,
    "worldSize.y": WORLD_SIZE_BOUNDS,
    initialAgentsAmount: entityAmountBounds,
    initialFoodSourcesAmount: entityAmountBounds,
    mutationRate: { min: 0, max: 1, step: 0.01, integer: false },
  };
}

export function getInvalidInitOptionFields(
  initOptions: InitOptions,
): ReadonlySet<string> {
  const bounds = getInitOptionBounds(initOptions);
  const values: Record<InitOptionField, number | undefined> = {
    "worldSize.x": initOptions.worldSize?.value.x,
    "worldSize.y": initOptions.worldSize?.value.y,
    initialAgentsAmount: initOptions.initialAgentsAmount?.value,
    initialFoodSourcesAmount: initOptions.initialFoodSourcesAmount?.value,
    mutationRate: initOptions.mutationRate?.value,
  };

  return new Set(
    (Object.keys(values) as InitOptionField[]).filter((field) => {
      const value = values[field];
      return hasValue(value) && !isWithinBounds(value, bounds[field]);
    }),
  );
}
