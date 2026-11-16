import seedrandom from "seedrandom";

export function setRandomSeed(seed: string) {
  seedrandom(seed, { global: true });
}
