import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import { SlButton, SlIcon } from "@shoelace-style/shoelace";
import {
  ManualSimulationTool,
  useSimulationStore,
} from "@/composables/simulationStore";
import { AgentPreviewSpriteData, FoodSourceSpriteData } from "./assets";
import { SIMULATION_TILE_SIZE } from "@/simulation/rendering";

@customElement("simulation-manual-tools")
export class SimulationManualTools extends SignalWatcher(LitElementWw) {
  simulationStore = useSimulationStore();

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

    sl-button[draggable="true"] {
      cursor: grab;
    }

    .tool-content {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .tool-sprite {
      width: ${SIMULATION_TILE_SIZE}px;
      height: ${SIMULATION_TILE_SIZE}px;
      object-fit: contain;
      image-rendering: pixelated;
    }

    .remove-tool::part(base) {
      color: var(--sl-color-danger-700);
      border-color: var(--sl-color-danger-500);
    }

    .remove-tool[variant="default"]::part(base) {
      color: var(--sl-color-danger-700);
      border-color: var(--sl-color-danger-500);
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
    return html`
      <sl-button
        size="small"
        draggable=${disabled ? "false" : "true"}
        ?disabled=${disabled}
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
        <span class="tool-content">
          <img class="tool-sprite" src=${spriteSource} alt="" />
          <span>${label}</span>
        </span>
      </sl-button>
    `;
  }

  private renderRemoveToolButton() {
    const isActive =
      this.simulationStore.activeManualTool.get() === "remove-entity";

    return html`
      <sl-button
        class="remove-tool"
        size="small"
        variant=${isActive ? "danger" : "default"}
        @click=${() => this.toggleRemoveMode()}
      >
        <span class="tool-content">
          <sl-icon name="eraser"></sl-icon>
          <span>Remove</span>
        </span>
      </sl-button>
    `;
  }

  render() {
    return html`
      <div id="manual-tools-container">
        ${this.renderSpriteToolButton({
          label: "Food Source",
          tool: "add-food-source",
          spriteSource: FoodSourceSpriteData,
        })}
        ${this.renderSpriteToolButton({
          label: "Agent",
          tool: "add-agent",
          spriteSource: AgentPreviewSpriteData,
        })}
        ${this.renderRemoveToolButton()}
      </div>
    `;
  }
}
