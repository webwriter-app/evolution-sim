import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { property } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import { EntitySelection } from "../model/entity-inspection";
import { SimulationEntityAside } from "./simulation-entity-aside";
import { SimulationEntityTabs } from "./simulation-entity-tabs";

export class SimulationEntityExplorer extends LitElementWw {
  @property({ attribute: false })
  accessor selection: EntitySelection | null = null;

  static readonly scopedElements = {
    "simulation-entity-aside": SimulationEntityAside,
    "simulation-entity-tabs": SimulationEntityTabs,
  };

  static readonly styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }

    @container (max-width: 34rem) {
      .explorer-layout {
        grid-template-columns: minmax(0, 1fr);
      }

      simulation-entity-aside {
        display: block;
        border-bottom: 1px solid var(--sl-color-neutral-200);
      }
    }

    .explorer-layout {
      display: grid;
      grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
      min-height: 18rem;
    }

    .content {
      min-width: 0;
      padding: 1rem;
    }
  `;

  render() {
    if (!this.selection) {
      return null;
    }

    return html`
      <div class="explorer-layout">
        <simulation-entity-aside
          .selection=${this.selection}
        ></simulation-entity-aside>
        <div class="content">
          <simulation-entity-tabs
            .selection=${this.selection}
          ></simulation-entity-tabs>
        </div>
      </div>
    `;
  }
}
