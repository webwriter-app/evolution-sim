export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
    )
  );
}

/** Returns a copy of `target` with the value at the dotted `path` replaced. */
export function withValueAt<T extends object>(
  target: T,
  path: string,
  value: unknown,
): T {
  const copy = structuredClone(target);
  const keys = path.split(".");
  const lastKey = keys.pop() as string;
  let node = copy as Record<string, unknown>;

  for (const key of keys) {
    if (typeof node[key] !== "object" || node[key] === null) {
      node[key] = {};
    }
    node = node[key] as Record<string, unknown>;
  }

  node[lastKey] = value;
  return copy;
}

/**
 * Deep-copies arrays and plain objects, keeping shared references shared.
 * Functions are kept by reference, which `structuredClone` cannot do; the
 * simulation state holds agent actions and strategies that point to each other.
 */
export function cloneWithFunctions<T>(
  value: T,
  copies = new WeakMap<object, unknown>(),
): T {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  if (copies.has(value)) {
    return copies.get(value) as T;
  }

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    copies.set(value, copy);
    for (const item of value) {
      copy.push(cloneWithFunctions(item, copies));
    }
    return copy as T;
  }

  const copy: Record<string, unknown> = {};
  copies.set(value, copy);
  for (const [key, item] of Object.entries(value)) {
    copy[key] = cloneWithFunctions(item, copies);
  }
  return copy as T;
}
