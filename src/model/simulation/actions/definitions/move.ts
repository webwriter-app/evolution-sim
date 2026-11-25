import { Direction, addVectors, isInBounds } from "../../position";
import { err, ok } from "../../../result";
import { ACTION_ERRORS } from "../action-errors";
import { defineAction } from "../define-action";
import { deepEqual } from "../../../deep";

export const moveActionDefinition = defineAction({
  name: "move",
  buildAction: ({ moveCost }) => {
    return ({ me, otherAgents, worldSize }, direction: Direction) => {
      const newEnergy = me.currentEnergy - moveCost;

      if (newEnergy < 0) {
        return err(ACTION_ERRORS.ERR_NOT_ENOUGH_ENERGY);
      } else {
        const newPosition = addVectors(me.position, direction);

        if (!isInBounds(newPosition, worldSize)) {
          return err(ACTION_ERRORS.ERR_OUT_OF_BOUNDS);
        } else if (
          otherAgents.some((agent) =>
            deepEqual(agent.state.position, newPosition),
          )
        ) {
          return err(ACTION_ERRORS.ERR_POSITION_OCCUPIED);
        } else {
          const changedAgent = {
            ...me,
            position: newPosition,
            currentEnergy: newEnergy,
          };

          return ok({
            me: changedAgent,
          });
        }
      }
    };
  },
});
