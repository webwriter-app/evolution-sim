import { consume } from "@lit/context";
import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import {
  SimulationStore,
  simulationStoreContext,
} from "@/composables/simulationStore";
import { SimulationEntityExplorer } from "./simulation-entity-explorer";
import { localized, msg } from "@lit/localize";

@customElement("simulation-entity-view")
@localized()
export class SimulationEntityView extends SignalWatcher(LitElementWw) {
  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  static readonly scopedElements = {
    "simulation-entity-explorer": SimulationEntityExplorer,
  };

  static readonly styles = css`
    #entity-inspector-container {
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      background: var(--sl-color-neutral-0);
      min-height: 18rem;
      overflow: hidden;
    }

    .empty-state {
      color: var(--sl-color-neutral-600);
      margin: 0;
      padding: 1rem;
    }
  `;

  render() {
    const selectedEntity = this.simulationStore.currentSelection.get();

    return html`
      <div id="entity-inspector-container">
        ${
          selectedEntity
            ? html`<simulation-entity-explorer
                .selection=${selectedEntity}
              ></simulation-entity-explorer>`
            : html`<p class="empty-state">${msg("No entity selected.")}</p>`
        }
      </div>
    `;
  }
}
