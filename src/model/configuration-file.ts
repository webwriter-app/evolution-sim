import type { SimulationConfiguration } from "../components/simulation-pre-configuration-aside";
import { getInvalidInitOptionFields } from "./configuration-validation";

const GRAPH_KEYS = [
  "enabled",
  "showPopulationGraph",
  "showFoodAvailabilityGraph",
  "showAlleleShareGraph",
  "showAlleleHistoricShareGraph",
] as const;

type Raw = Record<string, any>;

const isRecord = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLockable = (value: unknown, valueIs: (v: unknown) => boolean) =>
  isRecord(value) && typeof value.locked === "boolean" && valueIs(value.value);

const isNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);

/**
 * Reads a configuration file in the format of the data block (`{"configuration": {...}}`).
 * Throws `Error("invalid")` for anything that the widget could not run; the caller adds the message.
 */
export function parseConfigurationFile(text: string): SimulationConfiguration {
  const file: unknown = JSON.parse(text);
  const configuration = isRecord(file) ? file.configuration : undefined;
  const initOptions = isRecord(configuration) ? configuration.initOptions : undefined;
  const graphs = isRecord(configuration) ? configuration.graphs : undefined;

  const valid =
    isRecord(initOptions) &&
    isRecord(graphs) &&
    isLockable(initOptions.seed, (v) => typeof v === "string") &&
    isLockable(initOptions.initialAgentsAmount, isNumber) &&
    isLockable(initOptions.initialFoodSourcesAmount, isNumber) &&
    (initOptions.mutationRate === undefined || isLockable(initOptions.mutationRate, isNumber)) &&
    isLockable(initOptions.worldSize, (v) => isRecord(v) && isNumber(v.x) && isNumber(v.y)) &&
    GRAPH_KEYS.every((key) => typeof graphs[key] === "boolean");

  if (!valid || getInvalidInitOptionFields(initOptions as SimulationConfiguration["initOptions"]).size > 0) {
    throw new Error("invalid");
  }

  return configuration as SimulationConfiguration;
}
