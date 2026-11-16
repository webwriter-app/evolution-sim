import { Result, ok, err } from "../../result";
import { AgentContext } from "../agent-context";
import { ActionDecisionFromAction } from "../behavior/define-behavior";
import { ActionError } from "./action-errors";
import { Action } from "./define-action";

export type EnrichedActionDeciderMap<
  TActionMap extends Record<string, Action>,
> = {
  [TActionName in keyof TActionMap]: {
    canExecute: (
      ...params: TActionMap[TActionName] extends Action<infer _, infer TParams>
        ? [TParams] extends [never]
          ? []
          : [args: TParams]
        : never
    ) => Result<ActionDecisionFromAction<TActionMap[TActionName]>, ActionError>;
  };
};

export function buildEnrichedActionDeciderMap<
  TActionMap extends Record<string, Action>,
>(
  actionMap: TActionMap,
  agentContext: AgentContext,
): EnrichedActionDeciderMap<TActionMap> {
  return Object.fromEntries(Object.entries(actionMap).map(([name, action]) => {
    const canExecute = (params: never) => {
      const result = action.execute(agentContext, params);

      if (result.isOk()) {
        return ok({
          name: action.name,
          params,
        });
      } else {
        return err(result.error);
      }
    };

    return [name, { canExecute }];
  })) as unknown as EnrichedActionDeciderMap<TActionMap>;
}
