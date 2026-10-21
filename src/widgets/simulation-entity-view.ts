import { consume } from "@lit/context";
import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import { SlIconButton } from "@shoelace-style/shoelace";
import IconX from "bootstrap-icons/icons/x-lg.svg";
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
          label=${msg("Close")}
          @click=${() => this.simulationStore.clearSelection()}
        ></sl-icon-button>
        <simulation-entity-explorer
          .selection=${selectedEntity}
        ></simulation-entity-explorer>
      </div>
    `;
  }
}
