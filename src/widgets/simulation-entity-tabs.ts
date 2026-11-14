import { localizeElement, LocalizedElement } from "../../localization/localizer";
import { css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import { SlTab, SlTabGroup, SlTabPanel } from "@shoelace-style/shoelace";
import { EntitySelection } from "./utils/entityInspection";
import { SimulationAgentGeneticsTab } from "./simulation-agent-genetics-tab";
import { SimulationAgentAncestryTab } from "./simulation-agent-ancestry-tab";

@customElement("simulation-entity-tabs")
export class SimulationEntityTabs extends LocalizedElement {
  protected readonly messages = localizeElement(this);
  @property({ attribute: false })
  accessor selection: EntitySelection | null = null;

  static readonly scopedElements = {
    "sl-tab": SlTab,
    "sl-tab-group": SlTabGroup,
    "sl-tab-panel": SlTabPanel,
    "simulation-agent-genetics-tab": SimulationAgentGeneticsTab,
    "simulation-agent-ancestry-tab": SimulationAgentAncestryTab,
  };

  static readonly styles = css`
    .empty-state {
      color: var(--sl-color-neutral-600);
      margin: 0;
    }
  `;

  private renderAgentTabs(
    selection: Extract<EntitySelection, { type: "agent" }>,
  ) {
    return html`
      <sl-tab-group>
        <sl-tab slot="nav" panel="genetics">${this.messages.msg("Genetics")}</sl-tab>
        <sl-tab slot="nav" panel="ancestry">${this.messages.msg("Ancestry")}</sl-tab>
        <sl-tab-panel name="genetics">
          <simulation-agent-genetics-tab
            .genome=${selection.latestSnapshot.genome}
          ></simulation-agent-genetics-tab>
        </sl-tab-panel>
        <sl-tab-panel name="ancestry">
          <simulation-agent-ancestry-tab
            .agentId=${selection.entityId}
          ></simulation-agent-ancestry-tab>
        </sl-tab-panel>
      </sl-tab-group>
    `;
  }

  render() {
    if (!this.selection) {
      return null;
    }

    if (this.selection.type === "agent") {
      return this.renderAgentTabs(this.selection);
    }

    return html`<p class="empty-state">${this.messages.msg("No details available yet.")}</p>`;
  }
}
