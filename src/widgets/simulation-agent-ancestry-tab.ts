import { consume } from "@lit/context";
import { LitFlow } from "@ghchinoy/litflow";

import { css } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import {
  SimulationStore,
  simulationStoreContext,
} from "@/composables/simulationStore";
import {
  getImmediateAgentAncestry,
  getImmediateAncestryFlowModel,
} from "./utils/agentAncestry";
import { localized, msg } from "@lit/localize";

@customElement("simulation-agent-ancestry-tab")
@localized()
export class SimulationAgentAncestryTab extends SignalWatcher(LitElementWw) {
  @property()
  accessor agentId = "";

  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  static readonly scopedElements = {
    "lit-flow": LitFlow,
  };

  static readonly styles = css`
    .ancestry-tab {
      display: grid;
      gap: 0.75rem;
    }

    .flow-frame {
      height: 26rem;
      min-height: 20rem;
      overflow: hidden;
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      background: var(--sl-color-neutral-0);
    }

    .empty-state {
      color: var(--sl-color-neutral-600);
      margin: 0;
    }
  `;

  private readonly selectClickedAgent = (
    event: CustomEvent<{ nodes?: { id: string; selected?: boolean }[] }>,
  ) => {
    const selectedNode = event.detail.nodes?.find(
      (node) => node.selected === true && node.id !== this.agentId,
    );

    if (selectedNode) {
      this.simulationStore.selectEntity({
        entityId: selectedNode.id,
        entityType: "agent",
      });
    }
  };

  render() {
    const ancestry = getImmediateAgentAncestry(
      this.agentId,
      Array.from(this.simulationStore.simulationHistory),
    );

    if (!ancestry) {
      return html`<p class="empty-state">
        ${msg("No ancestry data available.")}
      </p>`;
    }

    const flowModel = getImmediateAncestryFlowModel(ancestry);

    return html`
      <div class="ancestry-tab">
        <div class="flow-frame">
          ${keyed(
            this.agentId,
            html`<lit-flow
              show-controls
              show-grid
              auto-fit
              .nodes=${flowModel.nodes}
              .edges=${flowModel.edges}
              .layoutDirection=${"TB"}
              .nodesDraggable=${false}
              .nodesConnectable=${false}
              .panOnDrag=${true}
              .zoomOnScroll=${true}
              @change=${this.selectClickedAgent}
            ></lit-flow>`,
          )}
        </div>
      </div>
    `;
  }
}
