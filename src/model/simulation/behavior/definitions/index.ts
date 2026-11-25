import { hasNoValue } from "../../../type-guards";
import { searchAndConsumeFoodBehavior } from "./search-and-consume-food";
import { reproduceBehavior } from "./reproduce";

const definedBehaviors = [
  searchAndConsumeFoodBehavior,
  reproduceBehavior,
] as const;

export function getDefinedBehavior(name: BehaviorName) {
  const behavior = definedBehaviors.find((behavior) => behavior.name === name);

  if (hasNoValue(behavior)) {
    // TODO remove dead path
    throw new Error(`Behavior with name ${name} not found`);
  }

  return behavior;
}

type DefinedBehavior = (typeof definedBehaviors)[number];

export type BehaviorName = DefinedBehavior["name"];
