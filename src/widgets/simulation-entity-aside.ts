import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { html } from "@lit-labs/signals";
import { localized, msg } from "@lit/localize";
import { FoodSourceSpriteData } from "./assets";
import { EntitySelection } from "./utils/entityInspection";
import { SimulationAgentGenomePreview } from "./simulation-agent-genome-preview";

@customElement("simulation-entity-aside")
@localized()
export class SimulationEntityAside extends LitElementWw {
  @property({ attribute: false })
  accessor selection: EntitySelection | null = null;

  static readonly scopedElements = {
    "simulation-agent-genome-preview": SimulationAgentGenomePreview,
  };

  static readonly styles = css`
    aside {
      border-right: 1px solid var(--sl-color-neutral-200);
      background: var(--sl-color-neutral-50);
      padding: 1rem;
      height: 100%;
      box-sizing: border-box;
    }

    .entity-title {
      font-size: 1rem;
      line-height: 1.25;
      margin: 0 0 1rem;
    }

    .entity-image-frame {
      display: flex;
      justify-content: center;
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      background: var(--sl-color-neutral-0);
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .entity-image {
      width: 4rem;
      height: 4rem;
      object-fit: contain;
      image-rendering: pixelated;
    }

    .section-title {
      color: var(--sl-color-neutral-700);
      font-size: 0.8rem;
      font-weight: var(--sl-font-weight-semibold);
      letter-spacing: 0.04em;
      margin: 0 0 0.5rem;
      text-transform: uppercase;
    }

    dl {
      display: grid;
      gap: 0.45rem;
      margin: 0;
    }

    .state-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    dt {
      color: var(--sl-color-neutral-600);
      font-size: 0.85rem;
    }

    dd {
      color: var(--sl-color-neutral-900);
      font-size: 0.85rem;
      font-weight: var(--sl-font-weight-semibold);
      margin: 0;
      text-align: right;
    }

    .limit-value {
      color: var(--sl-color-neutral-500);
      font-weight: var(--sl-font-weight-normal);
    }

    .removed-value {
      color: var(--sl-color-danger-700);
    }

    .entity-image-frame.removed {
      filter: grayscale(1);
      opacity: 0.6;
    }
  `;

  private renderRemovedRow(selection: EntitySelection) {
    if (selection.removedAtTick === null) {
      return null;
    }

    const label = selection.type === "agent" ? msg("Dead") : msg("Removed");

    return html`
      <div class="state-row">
        <dt>${msg("Status")}</dt>
        <dd class="removed-value">
          ${label}
          <span class="limit-value">
            (${msg("Tick")} ${selection.removedAtTick})
          </span>
        </dd>
      </div>
    `;
  }

  private renderState(selection: EntitySelection) {
    const isRemoved = selection.removedAtTick !== null;

    if (selection.type === "agent") {
      const { phenotype, state } = selection.latestSnapshot;

      return html`
        <dl>
          ${this.renderRemovedRow(selection)}
          <div class="state-row">
            <dt>${msg("Position")}</dt>
            <dd>${state.position.x}, ${state.position.y}</dd>
          </div>
          ${
            isRemoved
              ? null
              : html`
                  <div class="state-row">
                    <dt>${msg("Energy")}</dt>
                    <dd>
                      ${state.currentEnergy}
                      <span class="limit-value"
                        >/ ${phenotype.energyCapacity}</span
                      >
                    </dd>
                  </div>
                `
          }
        </dl>
      `;
    } else {
      const { position, ticksTillRecovery } = selection.latestSnapshot;

      return html`
        <dl>
          ${this.renderRemovedRow(selection)}
          <div class="state-row">
            <dt>${msg("Position")}</dt>
            <dd>${position.x}, ${position.y}</dd>
          </div>
          ${
            isRemoved
              ? null
              : html`
                  <div class="state-row">
                    <dt>${msg("Recovery")}</dt>
                    <dd>${ticksTillRecovery} ${msg("ticks")}</dd>
                  </div>
                `
          }
        </dl>
      `;
    }
  }

  private renderEntityImage(selection: EntitySelection) {
    if (selection.type === "agent") {
      return html`<simulation-agent-genome-preview
        .genome=${selection.latestSnapshot.genome}
      ></simulation-agent-genome-preview>`;
    }

    return html`<img
      class="entity-image"
      src=${FoodSourceSpriteData}
      alt=${msg("Food Source sprite")}
    />`;
  }

  render() {
    if (!this.selection) {
      return null;
    }

    const entityLabel =
      this.selection.type === "agent" ? msg("Agent") : msg("Food Source");

    return html`
      <aside aria-label=${msg("Selected entity metadata")}>
        <h2 class="entity-title">${entityLabel} ${this.selection.entityId}</h2>
        <div
          class=${classMap({
            "entity-image-frame": true,
            removed: this.selection.removedAtTick !== null,
          })}
        >
          ${this.renderEntityImage(this.selection)}
        </div>
        <h3 class="section-title">${msg("State")}</h3>
        ${this.renderState(this.selection)}
      </aside>
    `;
  }
}
