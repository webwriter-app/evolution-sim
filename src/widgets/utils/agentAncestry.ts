import { msg } from "@lit/localize";
import { AgentSnapshot } from "@/simulation/serialization";
import { hasValue } from "@/utils/typeGuards";

export interface ImmediateAgentAncestry {
  self: AgentSnapshot;
  parents: AgentSnapshot[];
  children: AgentSnapshot[];
}

export interface AncestryFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  measured: {
    width: number;
    height: number;
  };
  orientation: "vertical";
  selected?: boolean;
  data: {
    label: string;
  };
}

export interface AncestryFlowEdge {
  id: string;
  source: string;
  target: string;
  markerEnd: string;
  type: string;
}

export interface AncestryFlowModel {
  nodes: AncestryFlowNode[];
  edges: AncestryFlowEdge[];
}

const ROW_GAP = 180;
const COLUMN_GAP = 220;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 72;

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

export function getAncestryFlowModelKey(model: AncestryFlowModel): string {
  return model.nodes.map((node) => `${node.id}:${node.data.label}`).join("|");
}

type AncestryRelation = "parent" | "child" | "self";

function getRelationLabel(relation: AncestryRelation): string {
  switch (relation) {
    case "parent":
      return msg("Parent");
    case "child":
      return msg("Child");
    case "self":
      return msg("Agent");
  }
}

function formatAgentLabel(
  agent: AgentSnapshot,
  relation: AncestryRelation,
): string {
  return `${getRelationLabel(relation)} ${agent.id.slice(0, 8)}`;
}

function getCenteredX(index: number, rowLength: number): number {
  return (index - (rowLength - 1) / 2) * COLUMN_GAP;
}

function createRowNodes({
  agents,
  relation,
  type,
  y,
}: {
  agents: readonly AgentSnapshot[];
  relation: AncestryRelation;
  type: "input" | "output";
  y: number;
}): AncestryFlowNode[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    type,
    position: { x: getCenteredX(index, agents.length), y },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    measured: {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    },
    orientation: "vertical",
    data: {
      label: formatAgentLabel(agent, relation),
    },
  }));
}

export function getImmediateAncestryFlowModel(
  ancestry: ImmediateAgentAncestry,
): AncestryFlowModel {
  const parentNodes = createRowNodes({
    agents: ancestry.parents,
    relation: "parent",
    type: "input",
    y: 0,
  });
  const childNodes = createRowNodes({
    agents: ancestry.children,
    relation: "child",
    type: "output",
    y: ROW_GAP * 2,
  });

  return {
    nodes: [
      ...parentNodes,
      {
        id: ancestry.self.id,
        type: "default",
        position: { x: 0, y: ROW_GAP },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        measured: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        },
        orientation: "vertical",
        selected: true,
        data: {
          label: formatAgentLabel(ancestry.self, "self"),
        },
      },
      ...childNodes,
    ],
    edges: [
      ...ancestry.parents.map((parent) => ({
        id: `${parent.id}->${ancestry.self.id}`,
        source: parent.id,
        target: ancestry.self.id,
        markerEnd: "arrowclosed",
        type: "smoothstep",
      })),
      ...ancestry.children.map((child) => ({
        id: `${ancestry.self.id}->${child.id}`,
        source: ancestry.self.id,
        target: child.id,
        markerEnd: "arrowclosed",
        type: "smoothstep",
      })),
    ],
  };
}
