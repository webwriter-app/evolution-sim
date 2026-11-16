import { noop } from "../../actions/definitions/noop";
import { defineBehavior } from "../define-behavior";

export const reproduceBehavior = defineBehavior({
  name: "reproduce",
  decideAction: (_, __, actions) => {
    const reproduceAction = actions.reproduce.canExecute();

    if (reproduceAction.isOk()) {
      return reproduceAction.value;
    } else {
      return noop();
    }
  },
});
