import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement } from "lit/decorators.js";
import { useSimulationStore } from "@/composables/simulationStore";
import { SlButtonGroup, SlButton, SlIcon } from "@shoelace-style/shoelace";
import IconPause from "bootstrap-icons/icons/pause.svg";
import IconPlay from "bootstrap-icons/icons/play.svg";
import IconSkipEnd from "bootstrap-icons/icons/skip-end.svg";
import IconPlus from "bootstrap-icons/icons/plus.svg";
import IconArrowClockwise from "bootstrap-icons/icons/arrow-clockwise.svg";
import { when } from "lit/directives/when.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import { localized, msg } from "@lit/localize";

export type OpenNewSimulationDialogEvent = CustomEvent<unknown>;
@customElement("simulation-controls-bar")
@localized()
export class SimulationControlsBar extends SignalWatcher(LitElementWw) {
  simulationStore = useSimulationStore();

  /** Register the classes of custom elements to use in the Shadow DOM here.
   * @example
   * import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
   * ...
   *   static scopedElements = {"sl-button": SlButton}
   **/
  static scopedElements = {
    "sl-button-group": SlButtonGroup,
    "sl-button": SlButton,
    "sl-icon": SlIcon,
  };

  /** Put the styles for your Shadow DOM (what is rendered through render()) here. */
  static styles = css`
    #controls-container {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }
  `;

  openNewSimulationDialog() {
    this.dispatchEvent(
      new CustomEvent<undefined>("open-new-simulation-dialog", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Define your template here and return it. */
  render() {
    const status = this.simulationStore.simulationStatus.get();
    const hasActiveSimulation = status !== "uninitialized";
    const isRunning = status === "running";
    const selectedSpeed = this.simulationStore.simulationSpeed.get();
    const speedOptions = [0.25, 0.5, 1, 2, 5];

    return html`
      <div id="controls-container">
        <sl-button-group>
          ${when(
            isRunning,
            () => html`
              <sl-button @click=${() => this.simulationStore.stopSimulation()}>
                <sl-icon src=${IconPause}></sl-icon>
                ${msg("Pause")}
              </sl-button>
            `,
            () => html`
              <sl-button @click=${() => this.simulationStore.startSimulation()}>
                <sl-icon src=${IconPlay}></sl-icon>
                ${msg("Start")}
              </sl-button>
            `,
          )}
          <sl-button
            ?disabled=${!hasActiveSimulation || isRunning}
            @click=${() => this.simulationStore.runNextTick()}
          >
            <sl-icon src=${IconSkipEnd}></sl-icon>
            ${msg("Step")}
          </sl-button>
        </sl-button-group>
        <sl-button-group>
          <sl-button
            ?disabled=${!hasActiveSimulation}
            @click=${() => this.openNewSimulationDialog()}
          >
            <sl-icon src=${IconPlus}></sl-icon>
            ${msg("New")}
          </sl-button>
          <sl-button
            ?disabled=${!hasActiveSimulation}
            @click=${() => this.simulationStore.resetSimulation()}
          >
            <sl-icon src=${IconArrowClockwise}></sl-icon>
            ${msg("Reset")}
          </sl-button>
        </sl-button-group>
        <sl-button-group>
          ${speedOptions.map(
            (speed) => html`
              <sl-button
                variant=${selectedSpeed === speed ? "primary" : "default"}
                ?disabled=${!hasActiveSimulation}
                @click=${() => this.simulationStore.setSimulationSpeed(speed)}
              >
                ${speed}x
              </sl-button>
            `,
          )}
        </sl-button-group>
      </div>
    `;
  }
}
