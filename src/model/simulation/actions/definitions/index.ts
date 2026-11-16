import { eatActionDefinition } from "./eat";
import { moveActionDefinition } from "./move";
import { reproduceActionDefinition } from "./reproduce";
import { Action } from "../define-action";
import { Phenotype } from "../../genetics/phenotype";
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

export type DefinedAction = ReturnType<typeof getDefinedActions>[number];

export type ActionName = DefinedAction["name"];

export type ActionParams<TActionName extends ActionName> =
  Extract<DefinedAction, { name: TActionName }> extends {
    buildAction: (phenotype: Phenotype) => Action<TActionName, infer TParams>;
  }
    ? TParams
    : never;
