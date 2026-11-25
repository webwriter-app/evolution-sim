import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { consume } from "@lit/context";
import { css } from "lit";
import { property } from "lit/decorators.js";
import {
  SimulationStore,
  simulationStoreContext,
} from "./simulation-store";
import SlButtonGroup from "@shoelace-style/shoelace/dist/components/button-group/button-group.component.js";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlRadioGroup from "@shoelace-style/shoelace/dist/components/radio-group/radio-group.component.js";
import SlRadioButton from "@shoelace-style/shoelace/dist/components/radio-button/radio-button.component.js";
import IconPause from "@tabler/icons/outline/player-pause.svg";
import IconPlay from "@tabler/icons/outline/player-play.svg";
import IconSkipEnd from "@tabler/icons/outline/player-skip-forward.svg";
import IconPlus from "@tabler/icons/outline/plus.svg";
import IconArrowClockwise from "@tabler/icons/outline/rotate-clockwise.svg";
import { when } from "lit/directives/when.js";
import { html } from "@lit-labs/signals";


export type SimulationViewMode = "simulation" | "graphs";
export type ModeChangeEvent = CustomEvent<SimulationViewMode>;

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 5];

export class SimulationControlsBar extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  /** Currently selected view mode. */
  @property({ type: String })
  accessor mode: SimulationViewMode = "simulation";

  /** Whether the mode selection (Simulation / Graphs) is shown. */
  @property({ type: Boolean })
  accessor showModeSelect = false;

  static scopedElements = {
    "sl-button-group": SlButtonGroup,
    "sl-button": SlButton,
    "sl-icon": SlIcon,
    "sl-radio-group": SlRadioGroup,
    "sl-radio-button": SlRadioButton,
  };

  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      padding: var(--sl-spacing-x-small);
      gap: var(--sl-spacing-x-small);
    }

    sl-button::part(label) {
      display: flex;
      align-items: center;
    }

    .speed-button {
      min-width: 48px;
    }

    sl-icon {
      display: inline-block;
      height: 1.5em;
      width: 1.5em;
    }

    .spacer {
      flex-grow: 1;
    }

    .right {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sl-spacing-x-small);
      flex-grow: 1;
    }
  `;

  private openNewSimulationDialog() {
    this.dispatchEvent(
      new CustomEvent<undefined>("open-new-simulation-dialog", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private changeMode(mode: SimulationViewMode) {
    this.mode = mode;
    this.dispatchEvent(
      new CustomEvent<SimulationViewMode>("mode-change", {
        bubbles: true,
        composed: true,
        detail: mode,
      }),
    );
  }

  private cycleSpeed() {
    const currentIndex = SPEED_OPTIONS.indexOf(
      this.simulationStore.simulationSpeed.get(),
    );
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    this.simulationStore.setSimulationSpeed(SPEED_OPTIONS[nextIndex] ?? 1);
  }

  render() {
    const status = this.simulationStore.simulationStatus.get();
    const hasActiveSimulation = status !== "uninitialized";
    const isRunning = status === "running";
    const selectedSpeed = this.simulationStore.simulationSpeed.get();

    return html`
      ${when(
        this.showModeSelect,
        () => html`
          <sl-radio-group
            size="small"
            value=${this.mode}
            @sl-change=${(e: Event) =>
              this.changeMode(
                (e.target as SlRadioGroup).value as SimulationViewMode,
              )}
          >
            <sl-radio-button value="simulation">
              ${this.msg("Simulation")}
            </sl-radio-button>
            <sl-radio-button value="graphs">${this.msg("Graphs")}</sl-radio-button>
          </sl-radio-group>
        `,
      )}
      <div class="right">
        <div class="spacer"></div>
        <sl-button
          size="small"
          class="speed-button"
          pill
          ?disabled=${!hasActiveSimulation}
          @click=${() => this.cycleSpeed()}
        >
          ${selectedSpeed}x
        </sl-button>
        <sl-button-group>
          ${when(
            isRunning,
            () => html`
              <sl-button
                size="small"
                @click=${() => this.simulationStore.stopSimulation()}
              >
                <sl-icon src=${IconPause} slot="prefix"></sl-icon>
                ${this.msg("Pause")}
              </sl-button>
            `,
            () => html`
              <sl-button
                size="small"
                @click=${() => this.simulationStore.startSimulation()}
              >
                <sl-icon src=${IconPlay} slot="prefix"></sl-icon>
                ${this.msg("Start")}
              </sl-button>
            `,
          )}
          <sl-button
            size="small"
            ?disabled=${!hasActiveSimulation || isRunning}
            @click=${() => this.simulationStore.runNextTick()}
          >
            <sl-icon src=${IconSkipEnd} slot="prefix"></sl-icon>
            ${this.msg("Step")}
          </sl-button>
        </sl-button-group>
        <sl-button-group>
          <sl-button
            size="small"
            ?disabled=${!hasActiveSimulation}
            @click=${() => this.openNewSimulationDialog()}
          >
            <sl-icon src=${IconPlus} slot="prefix"></sl-icon>
            ${this.msg("New")}
          </sl-button>
          <sl-button
            size="small"
            ?disabled=${!hasActiveSimulation}
            @click=${() => this.simulationStore.resetSimulation()}
          >
            <sl-icon src=${IconArrowClockwise} slot="prefix"></sl-icon>
            ${this.msg("Reset")}
          </sl-button>
        </sl-button-group>
      </div>
    `;
  }
}
