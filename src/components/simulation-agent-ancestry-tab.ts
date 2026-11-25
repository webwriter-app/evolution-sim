import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { SceneController } from "@webwriter/lit/scene";
import { Viewport } from "@webwriter/lit/viewport";
import { Scene, sceneElements, webglAvailable } from "@webwriter/widget/scene";
import type { SelectDetail } from "@webwriter/widget/scene";
import { PixiScene } from "@webwriter/widget/scene/pixi";
import { consume } from "@lit/context";

import { css, nothing } from "lit";
import type { PropertyValues } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { property } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import {
  SimulationStore,
  simulationStoreContext,
} from "./simulation-store";
import {
  ANCESTRY_NODE_HEIGHT,
  ANCESTRY_NODE_WIDTH,
  AncestryRelation,
  layoutImmediateAncestry,
} from "../model/agent-ancestry";

const FIT_PADDING = 32;

export class SimulationAgentAncestryTab extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  @property()
  accessor agentId = "";

  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  static readonly scopedElements: Record<string, CustomElementConstructor> = {
    ...sceneElements,
    "ww-scene": webglAvailable() ? PixiScene : Scene,
  };

  static readonly styles = css`
    .ancestry-tab {
      display: grid;
      gap: 0.75rem;
    }

    .flow-frame {
      position: relative;
      height: 26rem;
      min-height: 20rem;
      overflow: hidden;
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      background: var(--sl-color-neutral-0);
    }

    ww-scene {
      width: 100%;
      height: 100%;
      --ww-scene-selection: var(--sl-color-primary-600);
    }

    ww-path {
      stroke: var(--sl-color-neutral-400);
      stroke-width: 1.5px;
    }

    ww-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--sl-color-neutral-0);
      color: var(--sl-color-neutral-900);
      border: 1px solid var(--sl-color-neutral-300);
      border-radius: var(--sl-border-radius-medium);
      box-shadow: var(--sl-shadow-small);
      font: var(--sl-font-size-small) var(--sl-font-sans);
      text-align: center;
      cursor: pointer;
    }

    ww-node.parent {
      border-top: 3px solid var(--sl-color-primary-600);
    }

    ww-node.child {
      border-bottom: 3px solid var(--sl-color-primary-600);
    }

    ww-node.self {
      border: 2px solid var(--sl-color-primary-600);
      cursor: default;
    }

    ww-node:focus-visible {
      outline: 2px solid var(--sl-color-primary-600);
      outline-offset: 2px;
    }

    .port {
      position: absolute;
      left: 50%;
      width: 6px;
      height: 6px;
      margin: -3px;
      border-radius: 50%;
      background: var(--sl-color-neutral-500);
    }

    .port.top {
      top: 0;
    }

    .port.bottom {
      top: 100%;
    }

    .controls {
      position: absolute;
      left: 0.75rem;
      bottom: 0.75rem;
    }

    .empty-state {
      color: var(--sl-color-neutral-600);
      margin: 0;
    }
  `;

  readonly #viewport: Viewport = new Viewport(this, {
    bounds: () => this.#scene.extent(),
    margin: FIT_PADDING,
    can: () => !this.#scene.marquee,
  });
  readonly #scene: SceneController = new SceneController(this, {
    viewport: this.#viewport.core,
  });
  #shownKey = "";

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    const key = this.#graphKey();

    if (key !== this.#shownKey) {
      this.#shownKey = key;
      this.#viewport.fit();
    }
  }

  #graphKey(): string {
    const ancestry = this.simulationStore?.getImmediateAgentAncestry(
      this.agentId,
    );

    return ancestry
      ? layoutImmediateAncestry(ancestry)
          .nodes.map((node) => `${node.relation}:${node.id}`)
          .join("|")
      : "";
  }

  private getRelationLabel(relation: AncestryRelation): string {
    switch (relation) {
      case "parent":
        return this.msg("Parent");
      case "child":
        return this.msg("Child");
      case "self":
        return this.msg("Agent");
    }
  }

  readonly #selectClickedAgent = (event: CustomEvent<SelectDetail>) => {
    const clicked = event.detail.keys.find((key) => key !== this.agentId);

    if (clicked) {
      this.simulationStore.selectEntity({
        entityId: clicked,
        entityType: "agent",
      });
    }
  };

  render() {
    const ancestry = this.simulationStore.getImmediateAgentAncestry(
      this.agentId,
    );

    if (!ancestry) {
      return html`<p class="empty-state">
        ${this.msg("No ancestry data available.")}
      </p>`;
    }

    const graph = layoutImmediateAncestry(ancestry);

    return html`
      <div class="ancestry-tab">
        <div class="flow-frame">
          <ww-scene
            select="single"
            aria-label=${this.msg("Ancestry")}
            data-ww-viewport="canvas"
            data-ww-viewport-zoom="0.25 2"
            data-ww-viewport-wheel="zoom"
            data-ww-viewport-fit-padding=${FIT_PADDING}
            background="dots"
            @ww-select=${this.#selectClickedAgent}
          >
            ${graph.edges.map(
              (edge) => html`
                <ww-path
                  data-ww-key=${edge.id}
                  from="${edge.from}:out"
                  to="${edge.to}:in"
                  route="step"
                  marker-end="arrow"
                ></ww-path>
              `,
            )}
            ${repeat(
              graph.nodes,
              (node) => `${node.relation}:${node.id}`,
              (node) => html`
                <ww-node
                  class=${node.relation}
                  data-ww-key=${node.id}
                  aria-label=${`${this.getRelationLabel(node.relation)} ${node.id}`}
                  x=${node.x}
                  y=${node.y}
                  width=${ANCESTRY_NODE_WIDTH}
                  height=${ANCESTRY_NODE_HEIGHT}
                  selectable
                  ?selected=${node.relation === "self"}
                >
                  ${node.relation === "parent"
                    ? nothing
                    : html`<span class="port top" data-ww-port="in"></span>`}
                  <span>${this.getRelationLabel(node.relation)}</span>
                  <span>${node.id.slice(0, 8)}</span>
                  ${node.relation === "child"
                    ? nothing
                    : html`<span class="port bottom" data-ww-port="out"></span>`}
                </ww-node>
              `,
            )}
          </ww-scene>
          <div class="controls" data-ww-viewport-controls></div>
        </div>
      </div>
    `;
  }
}
