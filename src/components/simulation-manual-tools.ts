import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { consume } from "@lit/context";
import { css } from "lit";
import { property } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import IconEraser from "@tabler/icons/outline/eraser.svg";
import {
  ManualSimulationTool,
  SimulationStore,
  simulationStoreContext,
} from "./simulation-store";
import { AgentPreviewSpriteData, FoodSourceSpriteData } from "./textures";
import { SIMULATION_TILE_SIZE } from "../model/simulation/rendering";

export class SimulationManualTools extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  @property({ attribute: "widget-id" })
  accessor widgetId = "";

  static readonly scopedElements = {
    "sl-button": SlButton,
    "sl-icon": SlIcon,
  };

  static readonly styles = css`
    #manual-tools-container {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    @media print {
      :host {
        display: none;
      }
    }

    sl-button[draggable="true"] {
      cursor: grab;
    }

    sl-button::part(label) {
      display: flex;
      align-items: center;
    }

    sl-icon {
      display: inline-block;
      height: 1.5em;
      width: 1.5em;
    }

    .tool-sprite {
      width: ${SIMULATION_TILE_SIZE}px;
      height: ${SIMULATION_TILE_SIZE}px;
      object-fit: contain;
      image-rendering: pixelated;
    }
  `;

  private startDrag(
    event: DragEvent,
    tool: ManualSimulationTool,
    dragImage?: HTMLElement,
  ) {
    this.simulationStore.setActiveManualTool(null);
    this.simulationStore.manualToolDnd.startDrag(tool, this.widgetId);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";

      if (dragImage) {
        event.dataTransfer.setDragImage(
          dragImage,
          SIMULATION_TILE_SIZE / 2,
          SIMULATION_TILE_SIZE / 2,
        );
      }
    }
  }

  private endDrag() {
    this.simulationStore.manualToolDnd.endDrag();
  }

  private toggleAddTool(tool: ManualSimulationTool) {
    this.simulationStore.manualToolDnd.endDrag();
    this.simulationStore.toggleActiveManualTool(tool);
  }

  private toggleRemoveMode() {
    this.simulationStore.manualToolDnd.endDrag();
    this.simulationStore.toggleActiveManualTool("remove-entity");
  }

  private renderSpriteToolButton({
    label,
    tool,
    spriteSource,
    disabled = false,
  }: {
    label: string;
    tool: ManualSimulationTool;
    spriteSource: string;
    disabled?: boolean;
  }) {
    const isActive = this.simulationStore.activeManualTool.get() === tool;

    return html`
      <sl-button
        size="small"
        aria-pressed=${isActive ? "true" : "false"}
        variant=${isActive ? "primary" : "default"}
        draggable=${disabled ? "false" : "true"}
        ?disabled=${disabled}
        @click=${() => this.toggleAddTool(tool)}
        @dragstart=${(event: DragEvent) => {
          const dragImage = (event.currentTarget as HTMLElement).querySelector(
            ".tool-sprite",
          );

          this.startDrag(
            event,
            tool,
            dragImage instanceof HTMLElement ? dragImage : undefined,
          );
        }}
        @dragend=${() => this.endDrag()}
      >
        <img class="tool-sprite" slot="prefix" src=${spriteSource} alt="" />
        ${label}
      </sl-button>
    `;
  }

  private renderRemoveToolButton() {
    const isActive =
      this.simulationStore.activeManualTool.get() === "remove-entity";

    return html`
      <sl-button
        size="small"
        aria-pressed=${isActive ? "true" : "false"}
        variant=${isActive ? "danger" : "default"}
        @click=${() => this.toggleRemoveMode()}
      >
        <sl-icon src=${IconEraser} slot="prefix"></sl-icon>
        ${this.msg("Remove")}
      </sl-button>
    `;
  }

  render() {
    return html`
      <div id="manual-tools-container">
        ${this.renderSpriteToolButton({
          label: this.msg("Food Source"),
          tool: "add-food-source",
          spriteSource: FoodSourceSpriteData,
        })}
        ${this.renderSpriteToolButton({
          label: this.msg("Agent"),
          tool: "add-agent",
          spriteSource: AgentPreviewSpriteData,
        })}
        ${this.renderRemoveToolButton()}
      </div>
    `;
  }
}
