import { Phenotype } from "../genetics/phenotype";
import { ActionDefinition } from "./define-action";

export type ActionMap<TActionDefinitions extends ActionDefinition[]> = {
  [TActionDefinition in TActionDefinitions[number] as TActionDefinition["name"]]: ReturnType<
    TActionDefinition["buildAction"]
  >;
};

export function buildActionMap<TDefinedActions extends ActionDefinition[]>(
  actionDefinitions: TDefinedActions,
  phenotype: Phenotype,
): ActionMap<TDefinedActions> {
  const buildActions = actionDefinitions.map((def) =>
    def.buildAction(phenotype),
  );

  return Object.fromEntries(
    buildActions.map((action) => [action.name, action]),
  ) as ActionMap<TDefinedActions>;
}
