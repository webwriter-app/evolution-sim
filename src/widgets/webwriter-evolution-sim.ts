import { css } from "lit";
// @ts-expect-error: Shoelace import
import "@shoelace-style/shoelace/dist/themes/light.css";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, state } from "lit/decorators.js";
import { SimulationRunView } from "./simulation-run-view";
import { SimulationCreationDialog } from "./simulation-creation-dialog";
import { SignalWatcher, html } from "@lit-labs/signals";
import { provide } from "@lit/context";
import {
  createSimulationStore,
  simulationStoreContext,
} from "@/composables/simulationStore";
import {
  ConfigurationChangeEvent,
  DEFAULT_SIMULATION_CONFIGURATION,
  SimulationConfiguration,
  SimulationPreConfigurationAside,
} from "./simulation-pre-configuration-aside";
import { SimulationInitOptions } from "@/simulation/Simulation.worker";
import { DEFAULT_MUTATION_RATE } from "@/simulation/constants";
import { isEqual } from "lodash-es";
import { hasValue } from "@/utils/typeGuards";
import LOCALIZE from "../../localization/generated";

/**
 * Agent-based simulation of evolution: agents search for food, reproduce and
 * pass on mutating genes. The widget renders the simulated world, lets users
 * inspect individual agents and their ancestry, and charts the population and
 * gene distribution over time.
 *
 * ### Agent behavior
 *
 * An agent's behavior is determined by its phenotype. From the phenotype, the
 * agent's strategy, behaviors and actions are derived. The agent's strategy is
 * the top level of an agent's behavioral pyramid. It consists of a set of
 * states and transitions between those states. Each state holds a behavior,
 * which is executed each tick as long as the agent is in that state. The
 * transitions are based on the agent's inner and perceived external state. A
 * behavior is a composition of actions and simple logic, based on the agent's
 * inner and perceived external state. An action is the most basic unit of
 * behavior.
 *
 * @fires {CustomEvent<SimulationConfiguration>} configuration-change - Fired when the configuration is changed in the options panel or when a new simulation is created. `detail` holds the new configuration.
 */
@customElement("webwriter-evolution-sim")
export class WebwriterEvolutionSim extends SignalWatcher(LitElementWw) {
  protected localize = LOCALIZE;

  /** @internal */
  @provide({ context: simulationStoreContext })
  private accessor simulationStore = createSimulationStore();

  private lastInitializedInitOptions: SimulationInitOptions | null = null;

  @state()
  private accessor isNewSimulationDialogOpen = false;

  /** @internal */
  static readonly scopedElements = {
    "simulation-run-view": SimulationRunView,
    "simulation-pre-configuration-aside": SimulationPreConfigurationAside,
    "simulation-creation-dialog": SimulationCreationDialog,
  };

  static readonly styles = css`
    #root {
      display: flex;
      flex-direction: column;
    }
  `;

  /**
   * Configuration of the simulation, serialized as JSON in the attribute.
   *
   * - `initOptions`: Initial options of the simulation (`seed`, `worldSize`, `initialAgentsAmount`, `initialFoodSourcesAmount`, `mutationRate`). Each option is an object `{ value, locked }`. A locked option cannot be changed by users, e.g. when creating a new simulation.
   * - `graphs`: Which analysis charts are shown (`enabled`, `showPopulationGraph`, `showFoodAvailabilityGraph`, `showAlleleShareGraph`, `showAlleleHistoricShareGraph`).
   */
  @property({ type: Object, attribute: true, reflect: true })
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

  connectedCallback() {
    super.connectedCallback();

    if (this.hasUpdated && !hasValue(this.lastInitializedInitOptions)) {
      this.initializeSimulationFromConfiguration();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    queueMicrotask(() => {
      if (!this.isConnected) {
        this.simulationStore.dispose();
        this.lastInitializedInitOptions = null;
      }
    });
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("simulationConfiguration")) {
      this.initializeSimulationFromConfiguration();
    }
  }

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

        ${
          this.isContentEditable
            ? html`<simulation-pre-configuration-aside
                part="options"
                .configuration=${this.simulationConfiguration}
                @configuration-change="${(e: ConfigurationChangeEvent) => {
                  this.simulationConfiguration = e.detail;
                }}"
              ></simulation-pre-configuration-aside>`
            : null
        }

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
