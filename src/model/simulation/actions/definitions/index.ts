import { eatActionDefinition } from "./eat";
import { moveActionDefinition } from "./move";
import { reproduceActionDefinition } from "./reproduce";
import { ActionMap } from "../action-map";
import { noopActionDefinition } from "./noop";

export function getDefinedActions() {
  return [
    moveActionDefinition,
    reproduceActionDefinition,
    eatActionDefinition,
    noopActionDefinition,
  ];
}

export type DefinedActionMap = ActionMap<ReturnType<typeof getDefinedActions>>;
