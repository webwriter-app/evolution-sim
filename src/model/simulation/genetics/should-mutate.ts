export function shouldMutate(mutationRate: number): boolean {
  return Math.random() < mutationRate;
}
