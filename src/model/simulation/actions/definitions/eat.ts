import { deepEqual } from "../../../deep";
import { err, ok } from "../../../result";
import { ACTION_ERRORS } from "../action-errors";
import { defineAction } from "../define-action";
import { FoodSource } from "../../food-source";

export const eatActionDefinition = defineAction({
  name: "eat",
  buildAction: ({ energyCapacity }) => {
    return ({ me, foodSources }, foodSource: FoodSource) => {
      const otherFoodSources = foodSources.filter((other) => other !== foodSource);

      if (!deepEqual(me.position, foodSource.position)) {
        return err(ACTION_ERRORS.ERR_NOT_IN_RANGE);
      } else if (foodSource.ticksTillRecovery > 0) {
        return err(ACTION_ERRORS.ERR_RESOURCE_UNAVAILABLE);
      } else {
        const energyGained = Math.min(
          foodSource.baseEnergyGainFromConsumption,
          energyCapacity - me.currentEnergy,
        );

        const changedAgent = {
          ...me,
          currentEnergy: me.currentEnergy + energyGained,
        };

        const changedFoodSource = {
          ...foodSource,
          ticksTillRecovery: foodSource.recoveryRate,
        };

        return ok({
          me: changedAgent,
          foodSources: [...otherFoodSources, changedFoodSource],
        });
      }
    };
  },
});
