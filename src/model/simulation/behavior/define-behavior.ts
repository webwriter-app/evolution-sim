import { DefinedActionMap } from "../actions/definitions";
import { AgentContext } from "../agent-context";
import { Phenotype } from "../genetics/phenotype";
import { Action } from "../actions/define-action";
import { EnrichedActionDeciderMap } from "../actions/action-decider-map";

export type ActionDecisionFromAction<
  TAction extends Action,
  TName = TAction["name"],
  TParams = Parameters<TAction["execute"]>[1],
> = [TParams] extends [never]
  ? { name: TName }
  : { name: TName; params: TParams };

type ActionDecision<TActionMap extends Record<string, Action>> = {
  [TActionName in keyof TActionMap]: ActionDecisionFromAction<
    TActionMap[TActionName]
  >;
}[keyof TActionMap];

interface BehaviorDefinition<TName extends string> {
  name: TName;
  decideAction: (
    phenotype: Phenotype,
    context: AgentContext,
    actions: EnrichedActionDeciderMap<DefinedActionMap>,
  ) => ActionDecision<DefinedActionMap>;
}

export function defineBehavior<TName extends string>({
  name,
  decideAction,
}: {
  name: TName;
  decideAction: (
    phenotype: Phenotype,
    context: AgentContext,
    actions: EnrichedActionDeciderMap<DefinedActionMap>,
  ) => ActionDecision<DefinedActionMap>;
}): BehaviorDefinition<TName> {
  return {
    name,
    decideAction,
  };
}
