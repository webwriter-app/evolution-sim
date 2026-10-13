import { hasNoValue } from "@/utils/typeGuards";
import { range, values } from "lodash-es";

export interface Vec2 {
  x: number;
  y: number;
}

export const Directions = {
  Up: { x: 0, y: -1 },
  Right: { x: 1, y: 0 },
  Down: { x: 0, y: 1 },
  Left: { x: -1, y: 0 },
} as const;

export type Direction = (typeof Directions)[keyof typeof Directions];

export const VEC_0 = { x: 0, y: 0 };

export function addVectors(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function scaleVector(vec: Vec2, factor: number): Vec2 {
  return {
    x: vec.x * factor,
    y: vec.y * factor,
  };
}

export function getDistance(a: Vec2, b: Vec2): number {
  return Math.floor(Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2));
}

export function getDirectionTowards(from: Vec2, to: Vec2): Direction {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? Directions.Right : Directions.Left;
  } else {
    return deltaY > 0 ? Directions.Down : Directions.Up;
  }
}

export function isInBounds(position: Vec2, worldSize: Vec2): boolean {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < worldSize.x &&
    position.y < worldSize.y
  );
}

export function getUniqueRandomPositions({
  amount,
  max,
}: {
  amount: number;
  max: Vec2;
}) {
  if (amount > max.x * max.y) {
    throw new Error(
      `Cannot place ${amount} unique positions in a world of size ${max.x}x${max.y}`,
    );
  }

  const allTiles = range(max.y).flatMap((y) =>
    range(max.x).map((x) => ({ x, y })),
  );
  const occupiedTiles = new Set<string>();
  const isFree = ({ x, y }: Vec2) => !occupiedTiles.has(`${x},${y}`);

  // A column or row is reused only once every column or row has been used.
  let unusedColumns = new Set<number>();
  let unusedRows = new Set<number>();
  const positions: Vec2[] = [];

  while (positions.length < amount) {
    if (unusedColumns.size === 0) {
      unusedColumns = new Set(range(max.x));
    }
    if (unusedRows.size === 0) {
      unusedRows = new Set(range(max.y));
    }

    const freeTiles = allTiles.filter(isFree);
    const inUnusedColumnAndRow = freeTiles.filter(
      ({ x, y }) => unusedColumns.has(x) && unusedRows.has(y),
    );
    const inUnusedColumnOrRow = freeTiles.filter(
      ({ x, y }) => unusedColumns.has(x) || unusedRows.has(y),
    );

    // Near a full world, no free tile may be left in an unused column and
    // row, so fall back to the best remaining tiles.
    const candidates = [
      inUnusedColumnAndRow,
      inUnusedColumnOrRow,
      freeTiles,
    ].find((tiles) => tiles.length > 0);
    const position = pickRandom(candidates ?? []);

    if (hasNoValue(position)) {
      break;
    }

    positions.push(position);
    occupiedTiles.add(`${position.x},${position.y}`);
    unusedColumns.delete(position.x);
    unusedRows.delete(position.y);
  }

  return positions;
}

function pickRandom<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

export function getRandomDirection(): Direction {
  const directions = values(Directions);
  const randomIndex = Math.floor(Math.random() * directions.length);
  return directions[randomIndex] ?? Directions.Up;
}
