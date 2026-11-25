import { hasValue } from "../model/type-guards";

type HandlerFunction = (value: string, event: InputEvent) => void;

export function createInputHandler(handler: HandlerFunction) {
  return (event: InputEvent) => {
    if (hasValue(event.target)) {
      const targetElement = event.target as HTMLInputElement;
      const targetValue = targetElement.value;

      handler(targetValue, event);
    }
  };
}
