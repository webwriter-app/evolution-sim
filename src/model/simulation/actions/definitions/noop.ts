import { ok } from "../../../result";
import { defineAction } from "../define-action";

export const noopActionDefinition = defineAction({
  name: "noop",
  buildAction: () => {
    return () => ok({});
  },
});

export function noop() {
  return { name: noopActionDefinition.name };
}
