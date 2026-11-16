import { err, ok } from "../../../result";
import { ACTION_ERRORS } from "../action-errors";
import { defineAction } from "../define-action";

export const reproduceActionDefinition = defineAction({
  name: "reproduce",
  buildAction: ({ reproductionCost }) => {
    return ({ me, otherAgents, spawnAgent }) => {
      const newEnergy = me.currentEnergy - reproductionCost;

      if (newEnergy < 0) {
        return err(ACTION_ERRORS.ERR_NOT_ENOUGH_ENERGY);
      } else {
        const changedAgent = {
          ...me,
          currentEnergy: newEnergy,
        };

        const newAgent = spawnAgent();

        return ok({
          me: changedAgent,
          otherAgents: [...otherAgents, newAgent],
        });
      }
    };
  },
});
