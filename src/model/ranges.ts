export function normalizeInRange({
  min,
  max,
  value,
}: {
  min: number;
  max: number;
  value: number;
}) {
  if (min > max) {
    throw new Error("normalizeInRange: min cannot be greater than max");
  }

  return Math.min(Math.max(value, min), max);
}
