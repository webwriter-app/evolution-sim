import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, state } from "lit/decorators.js";
import { SimulationRunView } from "./simulation-run-view";
import { SimulationCreationDialog } from "./simulation-creation-dialog";
import { SignalWatcher, html } from "@lit-labs/signals";
import { useSimulationStore } from "@/composables/simulationStore";
import {
  ConfigurationChangeEvent,
  DEFAULT_SIMULATION_CONFIGURATION,
  SimulationConfiguration,
  SimulationPreConfigurationAside,
} from "./simulation-pre-configuration-aside";
import { SimulationInitOptions } from "@/simulation/Simulation.worker";
import { DEFAULT_MUTATION_RATE } from "@/simulation/constants";
import { isEqual } from "lodash-es";
import LOCALIZE from "../../localization/generated";

@customElement("webwriter-evolution-sim")
export class WebwriterEvolutionSim extends SignalWatcher(LitElementWw) {
  localize = LOCALIZE;

  simulationStore = useSimulationStore();

  private lastInitializedInitOptions: SimulationInitOptions | null = null;

  @state()
  private accessor isNewSimulationDialogOpen = false;

  /** Register the classes of custom elements to use in the Shadow DOM here.
   * @example
   * import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
   * ...
   *   static scopedElements = {"sl-button": SlButton}
   **/
  static readonly scopedElements = {
    "simulation-run-view": SimulationRunView,
    "simulation-pre-configuration-aside": SimulationPreConfigurationAside,
    "simulation-creation-dialog": SimulationCreationDialog,
  };

  /** Put the styles for your Shadow DOM (what is rendered through render()) here. */
  static readonly styles = css`
    #root {
      display: flex;
      flex-direction: column;
    }
  `;

  @property({ attribute: true })
  accessor simulationConfiguration: SimulationConfiguration =
    DEFAULT_SIMULATION_CONFIGURATION;

  private getSimulationInitOptions(): SimulationInitOptions {
    const { initOptions } = this.simulationConfiguration;
    const worldSize = initOptions.worldSize.value;

    return {
      seed: initOptions.seed.value,
      worldSize: {
        x: worldSize.x,
        y: worldSize.y,
      },
      initialAgentsAmount: initOptions.initialAgentsAmount.value,
      initialFoodSourcesAmount: initOptions.initialFoodSourcesAmount.value,
      mutationRate: initOptions.mutationRate?.value ?? DEFAULT_MUTATION_RATE,
    };
  }

  private initializeSimulationFromConfiguration() {
    const initOptions = this.getSimulationInitOptions();

    if (isEqual(initOptions, this.lastInitializedInitOptions)) {
      return;
    }

    this.lastInitializedInitOptions = initOptions;
    this.simulationStore.initializeNewSimulation(initOptions);
  }

  firstUpdated() {
    this.initializeSimulationFromConfiguration();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("simulationConfiguration")) {
      this.initializeSimulationFromConfiguration();
    }
  }

  /** Define your template here and return it. */
  render() {
    return html`
      <div id="root">
        <simulation-creation-dialog
          .simulationConfiguration=${this.simulationConfiguration}
          .open=${this.isNewSimulationDialogOpen}
          @configuration-change="${(e: ConfigurationChangeEvent) => {
            this.simulationConfiguration = e.detail;
            this.isNewSimulationDialogOpen = false;
          }}"
          @dialog-close=${() => {
            this.isNewSimulationDialogOpen = false;
          }}
        ></simulation-creation-dialog>

        <simulation-pre-configuration-aside
          part="options"
          .configuration=${this.simulationConfiguration}
          @configuration-change="${(e: ConfigurationChangeEvent) => {
            this.simulationConfiguration = e.detail;
          }}"
        ></simulation-pre-configuration-aside>

        <simulation-run-view
          .configuration=${this.simulationConfiguration}
          @open-new-simulation-dialog=${() => {
            this.isNewSimulationDialogOpen = true;
          }}
        ></simulation-run-view>
      </div>
    `;
  }
}
