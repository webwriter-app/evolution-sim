import { defineBehavior } from "../define-behavior";
import {
  getDirectionTowards,
  getDistance,
  getRandomDirection,
} from "../../position";
import { ACTION_ERRORS } from "../../actions/action-errors";
import { hasValue } from "../../../type-guards";
import { noop } from "../../actions/definitions/noop";

export const searchAndConsumeFoodBehavior = defineBehavior({
  name: "search-and-consume-food",
  decideAction: (_, context, actions) => {
    const { me, foodSources } = context;

    const foodSourcesSortedByDistance = foodSources
      .toSorted(
        (a, b) =>
          getDistance(me.position, a.position) -
          getDistance(me.position, b.position),
      ).filter((foodSource) => foodSource.ticksTillRecovery === 0);

    const closestFoodSource = foodSourcesSortedByDistance.at(0);

    if (hasValue(closestFoodSource)) {
      const eatAction = actions.eat.canExecute(closestFoodSource);

      if (eatAction.isOk()) {
        return eatAction.value;
      } else if (eatAction.error === ACTION_ERRORS.ERR_NOT_IN_RANGE) {
        const directionToMove = getDirectionTowards(
          me.position,
          closestFoodSource.position,
        );

        const moveAction = actions.move.canExecute(directionToMove);

        if (moveAction.isOk()) {
          return moveAction.value;
        } else {
          return noop();
        }
      }
    } else {
      const randomDirection = getRandomDirection();

      const moveAction = actions.move.canExecute(randomDirection);

      if (moveAction.isOk()) {
        return moveAction.value;
      }
    }

    return noop();
  },
});
