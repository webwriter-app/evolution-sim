import { hasValue } from "../../type-guards";
import { AgentContext } from "../agent-context";
import { BehaviorName } from "../behavior/definitions";
import { Phenotype } from "../genetics/phenotype";

interface StrategyState {
  id: string;
  behaviorToExecute: BehaviorName;
}

interface StrategyTransition {
  from: StrategyState;
  to: StrategyState;
  shouldBeExecuted: (context: AgentContext) => boolean;
}

export interface Strategy {
  currentState: StrategyState;
  states: StrategyState[];
  transitions: StrategyTransition[];
}

export function buildAgentStrategy(phenotype: Phenotype): Strategy {
  const initialState: StrategyState = {
    id: "eat",
    behaviorToExecute: "search-and-consume-food",
  };

  const reproduceState: StrategyState = {
    id: "reproduce",
    behaviorToExecute: "reproduce",
  };

  const transition1: StrategyTransition = {
    from: initialState,
    to: reproduceState,
    shouldBeExecuted: (context: AgentContext) => {
      return context.me.currentEnergy >= phenotype.reproductionCost * 1.5;
    },
  };

  const transition2: StrategyTransition = {
    from: reproduceState,
    to: initialState,
    shouldBeExecuted: (context: AgentContext) => {
      return context.me.currentEnergy < phenotype.reproductionCost;
    },
  };

  return {
    currentState: initialState,
    states: [initialState, reproduceState],
    transitions: [transition1, transition2],
  };
}

export function getBehaviorToExecute(
  context: AgentContext,
  strategy: Strategy,
) {
  const relevantTransitions = strategy.transitions.filter(
    (transition) => transition.from === strategy.currentState,
  );

  const transitionToExecute = relevantTransitions.find((transition) =>
    transition.shouldBeExecuted(context),
  );

  if (hasValue(transitionToExecute)) {
    strategy.currentState = transitionToExecute.to;
  }

  return strategy.currentState.behaviorToExecute;
}
