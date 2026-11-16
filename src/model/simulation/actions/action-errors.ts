export const ACTION_ERRORS = {
  ERR_NOT_ENOUGH_ENERGY: "not-enough-energy",
  ERR_OUT_OF_BOUNDS: "out-of-bounds",
  ERR_NOT_IN_RANGE: "not-in-range",
  ERR_POSITION_OCCUPIED: "position-occupied",
  ERR_RESOURCE_UNAVAILABLE: "resource-unavailable",
} as const;

export type ActionError = (typeof ACTION_ERRORS)[keyof typeof ACTION_ERRORS];

export const ACTION_OK = "ok";

export type ActionSuccess = typeof ACTION_OK;

export type ActionResult = ActionSuccess | ActionError;
