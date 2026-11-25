declare module "worker:*" {
  const content: string;
  export default content;
}

declare module "@webwriter/build/test" {
  export function getMochaConfig(): Mocha.MochaOptions;
}
