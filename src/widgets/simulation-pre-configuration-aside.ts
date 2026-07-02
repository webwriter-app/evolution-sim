import { css } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SlCard, SlInput, SlSwitch } from "@shoelace-style/shoelace";
import { SignalWatcher, html } from "@lit-labs/signals";
import { cloneDeep, set } from "lodash-es";
import { createInputHandler } from "@/utils/handleInput";
import { DEFAULT_GRAPH_OPTIONS, GraphConfig } from "./simulation-analysis-view";
import { SimulationInitOptions } from "@/simulation/Simulation.worker";
import {
  DEFAULT_MUTATION_RATE,
  SIMULATION_FOOD_AMOUNT,
  SIMULATION_INITIAL_AGENT_COUNT,
  SIMULATION_WORLD_SIZE,
} from "@/simulation/constants";

/* Optional LOCALIZATION: Uncomment this after first running `npm run localize` in the command line.
import LOCALIZE from '../localization/generated'
import {msg} from '@lit/localize'
*/

type LockableValue<T> = {
  locked: boolean;
  value: T;
};

type LockableInitOptions = {
  [key in keyof SimulationInitOptions]: LockableValue<
    SimulationInitOptions[key]
  >;
};

export type SimulationConfiguration = {
  graphs: GraphConfig;
  initOptions: LockableInitOptions;
};

export const DEFAULT_SIMULATION_CONFIGURATION: SimulationConfiguration = {
  initOptions: {
    seed: {
      locked: false,
      value: "",
    },
    initialAgentsAmount: {
      locked: false,
      value: SIMULATION_INITIAL_AGENT_COUNT,
    },
    initialFoodSourcesAmount: {
      locked: false,
      value: SIMULATION_FOOD_AMOUNT,
    },
    mutationRate: {
      locked: false,
      value: DEFAULT_MUTATION_RATE,
    },
    worldSize: {
      locked: false,
      value: SIMULATION_WORLD_SIZE,
    },
  },
  graphs: {
    enabled: true,
    showPopulationGraph: true,
    showFoodAvailabilityGraph: true,
    showAlleleShareGraph: true,
    showAlleleHistoricShareGraph: true,
  },
};

export type ConfigurationChangeEvent = CustomEvent<SimulationConfiguration>;

@customElement("simulation-pre-configuration-aside")
export class SimulationPreConfigurationAside extends SignalWatcher(
  LitElementWw,
) {
  /* Optional LOCALIZATION: Uncomment this after first running `npm run localize` in the command line.
  localize = LOCALIZE
  */

  @property({ attribute: false })
  accessor configuration: SimulationConfiguration =
    DEFAULT_SIMULATION_CONFIGURATION;

  private emitConfigurationChange(configuration: SimulationConfiguration) {
    console.log("INFO - Change configuration", configuration);

    this.dispatchEvent(
      new CustomEvent<SimulationConfiguration>("configuration-change", {
        detail: configuration,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private updateConfiguration(target: string, value: unknown) {
    const updatedConfiguration = set(
      cloneDeep(this.configuration),
      target,
      value,
    );

    this.emitConfigurationChange(updatedConfiguration);
  }

  toggleGraphOption(option: keyof SimulationConfiguration["graphs"]) {
    this.emitConfigurationChange({
      ...this.configuration,
      graphs: {
        ...DEFAULT_GRAPH_OPTIONS,
        ...this.configuration.graphs,
        [option]: !this.configuration.graphs?.[option],
      },
    });
  }

  /** Register the classes of custom elements to use in the Shadow DOM here.
   * @example
   * import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
   * ...
   *   static scopedElements = {"sl-button": SlButton}
   **/
  static readonly scopedElements = {
    "sl-input": SlInput,
    "sl-card": SlCard,
    "sl-switch": SlSwitch,
  };

  /** Put the styles for your Shadow DOM (what is rendered through render()) here. */
  static readonly styles = css`
    #pre-configuration-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .config-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .config-title {
      text-align: center;
    }

    .init-option {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .init-option-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      color: var(--sl-color-neutral-700, #374151);
      font-size: var(--sl-font-size-small, 0.875rem);
      line-height: 1.2;
    }

    .init-option-label {
      min-width: 0;
    }

    .init-option sl-input {
      width: 100%;
    }

    .init-option sl-switch {
      flex: 0 0 auto;
      white-space: nowrap;
    }

    .world-size-inputs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.4rem;
    }

    h4 {
      margin: 0 0 0.15rem;
    }
  `;

  renderInitOptionConfiguration(
    label: string,
    option: keyof SimulationConfiguration["initOptions"],
  ) {
    const currentOption =
      this.configuration.initOptions[option] ??
      DEFAULT_SIMULATION_CONFIGURATION.initOptions[option];
    const isMutationRateOption = option === "mutationRate";

    return html`
      <div class="init-option">
        <div class="init-option-header">
          <span class="init-option-label">${label}</span>
          <sl-switch
            size="small"
            .checked="${currentOption.locked}"
            @input="${() =>
              this.updateConfiguration(
                `initOptions.${option}.locked`,
                !currentOption.locked,
              )}"
          >
            Lock
          </sl-switch>
        </div>
        <sl-input
          type="${option === "seed" ? "text" : "number"}"
          aria-label="${label}"
          min=${ifDefined(isMutationRateOption ? "0" : undefined)}
          max=${ifDefined(isMutationRateOption ? "1" : undefined)}
          step=${ifDefined(isMutationRateOption ? "0.01" : undefined)}
          .value="${String(currentOption.value)}"
          @input="${createInputHandler((e) =>
            this.updateConfiguration(
              `initOptions.${option}.value`,
              option === "seed" ? e : Number(e),
            ),
          )}"
        ></sl-input>
      </div>
    `;
  }

  renderWorldSizeConfiguration() {
    const currentOption = this.configuration.initOptions.worldSize;

    return html`
      <div class="init-option">
        <div class="init-option-header">
          <span class="init-option-label">World Size</span>
          <sl-switch
            size="small"
            .checked="${currentOption.locked}"
            @input="${() =>
              this.updateConfiguration(
                "initOptions.worldSize.locked",
                !currentOption.locked,
              )}"
          >
            Lock
          </sl-switch>
        </div>
        <div class="world-size-inputs">
          <sl-input
            type="number"
            label="W"
            .value="${String(currentOption.value.x)}"
            @input="${createInputHandler((e) =>
              this.updateConfiguration(
                "initOptions.worldSize.value.x",
                Number(e),
              ),
            )}"
          ></sl-input>
          <sl-input
            type="number"
            label="H"
            .value="${String(currentOption.value.y)}"
            @input="${createInputHandler((e) =>
              this.updateConfiguration(
                "initOptions.worldSize.value.y",
                Number(e),
              ),
            )}"
          ></sl-input>
        </div>
      </div>
    `;
  }

  /** Define your template here and return it. */
  render() {
    return html`
      <div id="pre-configuration-container">
        <h3 class="config-title">Configuration</h3>
        <sl-card>
          <h4>Initial Options</h4>
          <div class="config-container">
            ${this.renderInitOptionConfiguration("Seed", "seed")}
            ${this.renderWorldSizeConfiguration()}
            ${this.renderInitOptionConfiguration(
              "Initial Food Sources",
              "initialFoodSourcesAmount",
            )}
            ${this.renderInitOptionConfiguration(
              "Initial Agents",
              "initialAgentsAmount",
            )}
            ${this.renderInitOptionConfiguration(
              "Mutation Rate",
              "mutationRate",
            )}
          </div>
        </sl-card>
        <sl-card>
          <div class="config-container">
            <h4>Graphs</h4>
            <sl-switch
              .checked="${this.configuration.graphs?.enabled ?? true}"
              @input="${() => this.toggleGraphOption("enabled")}"
            >
              Enabled
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs?.showPopulationGraph ??
              true}"
              @input="${() => this.toggleGraphOption("showPopulationGraph")}"
            >
              Show Population Graph
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs
                ?.showFoodAvailabilityGraph ?? true}"
              @input="${() =>
                this.toggleGraphOption("showFoodAvailabilityGraph")}"
            >
              Show Food Availability Graph
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs?.showAlleleShareGraph ??
              true}"
              @input="${() => this.toggleGraphOption("showAlleleShareGraph")}"
            >
              Show Allele Share Graph
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs
                ?.showAlleleHistoricShareGraph ?? true}"
              @input="${() =>
                this.toggleGraphOption("showAlleleHistoricShareGraph")}"
            >
              Show Allele Historic Share Graph
            </sl-switch>
          </div>
        </sl-card>
      </div>
    `;
  }
}
