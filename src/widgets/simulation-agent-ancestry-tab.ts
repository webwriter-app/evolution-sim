import { LitFlow } from "@ghchinoy/litflow";

import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import { useSimulationStore } from "@/composables/simulationStore";
import {
  getImmediateAgentAncestry,
  getImmediateAncestryFlowModel,
} from "./utils/agentAncestry";

@customElement("simulation-agent-ancestry-tab")
export class SimulationAgentAncestryTab extends SignalWatcher(LitElementWw) {
  @property()
  accessor agentId = "";

  private readonly simulationStore = useSimulationStore();

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

  render() {
    const ancestry = getImmediateAgentAncestry(
      this.agentId,
      Array.from(this.simulationStore.simulationHistory),
    );

    if (!ancestry) {
      return html`<p class="empty-state">No ancestry data available.</p>`;
    }

    const flowModel = getImmediateAncestryFlowModel(ancestry);

    return html`
      <div class="ancestry-tab">
        <div class="flow-frame">
          <lit-flow
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
          ></lit-flow>
        </div>
      </div>
    `;
  }
}
