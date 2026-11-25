import { AgentSnapshot } from "./simulation/serialization";
import { hasValue } from "./type-guards";

export interface ImmediateAgentAncestry {
  self: AgentSnapshot;
  parents: AgentSnapshot[];
  children: AgentSnapshot[];
}

export type AncestryRelation = "parent" | "child" | "self";

interface AncestryNode {
  id: string;
  relation: AncestryRelation;
  /** Top-left corner in scene coordinates. */
  x: number;
  y: number;
}

interface AncestryEdge {
  id: string;
  from: string;
  to: string;
}

interface AncestryGraph {
  nodes: AncestryNode[];
  edges: AncestryEdge[];
}

export const ANCESTRY_NODE_WIDTH = 150;
export const ANCESTRY_NODE_HEIGHT = 72;

const ROW_GAP = 180;
const COLUMN_GAP = 220;

export function getImmediateAgentAncestry(
  agentId: string,
  latestAgentSnapshots: ReadonlyMap<string, AgentSnapshot>,
  childIdsByParentId: ReadonlyMap<string, readonly string[]>,
): ImmediateAgentAncestry | null {
  const self = latestAgentSnapshots.get(agentId) ?? null;

  if (!hasValue(self)) {
    return null;
  }

  const parents = (self.parentIds ?? []).map(
    (parentId) => latestAgentSnapshots.get(parentId) ?? null,
  );

  if (!parents.every(hasValue)) {
    return null;
  }

  const children = (childIdsByParentId.get(agentId) ?? [])
    .filter((childId) => childId !== agentId)
    .map((childId) => latestAgentSnapshots.get(childId) ?? null)
    .filter(hasValue);

  return {
    self,
    parents,
    children,
  };
}

function getCenteredX(index: number, rowLength: number): number {
  return (index - (rowLength - 1) / 2) * COLUMN_GAP;
}

function createRow(
  agents: readonly AgentSnapshot[],
  relation: AncestryRelation,
  y: number,
): AncestryNode[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    relation,
    x: getCenteredX(index, agents.length),
    y,
  }));
}

/** Parents above the agent, children below it, each row centred. */
export function layoutImmediateAncestry(
  ancestry: ImmediateAgentAncestry,
): AncestryGraph {
  const parents = createRow(ancestry.parents, "parent", 0);
  const self: AncestryNode = {
    id: ancestry.self.id,
    relation: "self",
    x: 0,
    y: ROW_GAP,
  };
  const children = createRow(ancestry.children, "child", ROW_GAP * 2);
  const edge = (from: AncestryNode, to: AncestryNode): AncestryEdge => ({
    id: `${from.id}->${to.id}`,
    from: from.id,
    to: to.id,
  });

  const nodes = [...parents, self, ...children];

  return {
    nodes,
    edges: [
      ...parents.map((parent) => edge(parent, self)),
      ...children.map((child) => edge(self, child)),
    ],
  };
}
