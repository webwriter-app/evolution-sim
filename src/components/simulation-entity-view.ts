import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { consume } from "@lit/context";
import { css } from "lit";

import { html } from "@lit-labs/signals";
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js";
import IconX from "@tabler/icons/outline/x.svg";
import {
  SimulationStore,
  simulationStoreContext,
} from "./simulation-store";
import { SimulationEntityExplorer } from "./simulation-entity-explorer";

export class SimulationEntityView extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  static readonly scopedElements = {
    "simulation-entity-explorer": SimulationEntityExplorer,
    "sl-icon-button": SlIconButton,
  };

  static readonly styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    #entity-inspector-container {
      position: relative;
      border: 1px solid var(--sl-color-neutral-200);
      background: var(--sl-color-neutral-0);
      min-height: 18rem;
      overflow: hidden;
    }

    #close-button {
      position: absolute;
      top: var(--sl-spacing-2x-small);
      right: var(--sl-spacing-2x-small);
      z-index: 1;
    }
  `;

  willUpdate() {
    this.hidden = !this.simulationStore.currentSelection.get();
  }

  render() {
    const selectedEntity = this.simulationStore.currentSelection.get();

    if (!selectedEntity) {
      return null;
    }

    return html`
      <div id="entity-inspector-container">
        <sl-icon-button
          id="close-button"
          src=${IconX}
          label=${this.msg("Close")}
          @click=${() => this.simulationStore.clearSelection()}
        ></sl-icon-button>
        <simulation-entity-explorer
          .selection=${selectedEntity}
        ></simulation-entity-explorer>
      </div>
    `;
  }
}
