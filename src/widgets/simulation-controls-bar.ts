import { consume } from "@lit/context";
import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import {
  SimulationStore,
  simulationStoreContext,
} from "@/composables/simulationStore";
import {
  SlButtonGroup,
  SlButton,
  SlIcon,
  SlRadioGroup,
  SlRadioButton,
} from "@shoelace-style/shoelace";
import IconPause from "bootstrap-icons/icons/pause.svg";
import IconPlay from "bootstrap-icons/icons/play.svg";
import IconSkipEnd from "bootstrap-icons/icons/skip-end.svg";
import IconPlus from "bootstrap-icons/icons/plus.svg";
import IconArrowClockwise from "bootstrap-icons/icons/arrow-clockwise.svg";
import { when } from "lit/directives/when.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import { localized, msg } from "@lit/localize";

export type OpenNewSimulationDialogEvent = CustomEvent<unknown>;

export type SimulationViewMode = "simulation" | "graphs";
export type ModeChangeEvent = CustomEvent<SimulationViewMode>;

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 5];

@customElement("simulation-controls-bar")
@localized()
export class SimulationControlsBar extends SignalWatcher(LitElementWw) {
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
              ${msg("Simulation")}
            </sl-radio-button>
            <sl-radio-button value="graphs">${msg("Graphs")}</sl-radio-button>
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
                ${msg("Pause")}
              </sl-button>
            `,
            () => html`
              <sl-button
                size="small"
                @click=${() => this.simulationStore.startSimulation()}
              >
                <sl-icon src=${IconPlay} slot="prefix"></sl-icon>
                ${msg("Start")}
              </sl-button>
            `,
          )}
          <sl-button
            size="small"
            ?disabled=${!hasActiveSimulation || isRunning}
            @click=${() => this.simulationStore.runNextTick()}
          >
            <sl-icon src=${IconSkipEnd} slot="prefix"></sl-icon>
            ${msg("Step")}
          </sl-button>
        </sl-button-group>
        <sl-button-group>
          <sl-button
            size="small"
            ?disabled=${!hasActiveSimulation}
            @click=${() => this.openNewSimulationDialog()}
          >
            <sl-icon src=${IconPlus} slot="prefix"></sl-icon>
            ${msg("New")}
          </sl-button>
          <sl-button
            size="small"
            ?disabled=${!hasActiveSimulation}
            @click=${() => this.simulationStore.resetSimulation()}
          >
            <sl-icon src=${IconArrowClockwise} slot="prefix"></sl-icon>
            ${msg("Reset")}
          </sl-button>
        </sl-button-group>
      </div>
    `;
  }
}
