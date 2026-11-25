import { widgetMsg } from "@webwriter/lit/localize";
import { css } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { LitElementWw } from "@webwriter/lit";
import { property } from "lit/decorators.js";
import SlCard from "@shoelace-style/shoelace/dist/components/card/card.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.component.js";
import { html } from "@lit-labs/signals";
import { withValueAt } from "../model/deep";
import { createInputHandler } from "./handle-input";
import { DEFAULT_GRAPH_OPTIONS, GraphConfig } from "./simulation-analysis-view";
import { SimulationInitOptions } from "../model/simulation/simulation.worker";
import {
  DEFAULT_MUTATION_RATE,
  SIMULATION_FOOD_AMOUNT,
  SIMULATION_INITIAL_AGENT_COUNT,
  SIMULATION_WORLD_SIZE,
} from "../model/simulation/constants";
import {
  getInitOptionBounds,
  getInvalidInitOptionFields,
} from "../model/configuration-validation";

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

export class SimulationPreConfigurationAside extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  @property({ attribute: false })
  accessor configuration: SimulationConfiguration =
    DEFAULT_SIMULATION_CONFIGURATION;

  private emitConfigurationChange(configuration: SimulationConfiguration) {

    this.dispatchEvent(
      new CustomEvent<SimulationConfiguration>("configuration-change", {
        detail: configuration,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private updateConfiguration(target: string, value: unknown) {
    const updatedConfiguration = withValueAt(this.configuration, target, value);

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

  static readonly scopedElements = {
    "sl-input": SlInput,
    "sl-card": SlCard,
    "sl-switch": SlSwitch,
  } as unknown as Record<string, CustomElementConstructor>;

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

    sl-input.invalid {
      --sl-input-border-color: var(--sl-color-danger-600);
      --sl-input-border-color-hover: var(--sl-color-danger-600);
      --sl-input-border-color-focus: var(--sl-color-danger-600);
      --sl-input-focus-ring-color: var(--sl-color-danger-300);
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
    const bounds =
      option === "seed" || option === "worldSize"
        ? undefined
        : getInitOptionBounds(this.configuration.initOptions)[option];
    const isInvalid = getInvalidInitOptionFields(
      this.configuration.initOptions,
    ).has(option);

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
            ${this.msg("Lock")}
          </sl-switch>
        </div>
        <sl-input
          class=${isInvalid ? "invalid" : ""}
          type="${option === "seed" ? "text" : "number"}"
          aria-label="${label}"
          min=${ifDefined(bounds?.min)}
          max=${ifDefined(bounds?.max)}
          step=${ifDefined(bounds?.step)}
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
    const invalidFields = getInvalidInitOptionFields(
      this.configuration.initOptions,
    );
    const bounds = getInitOptionBounds(this.configuration.initOptions);

    return html`
      <div class="init-option">
        <div class="init-option-header">
          <span class="init-option-label">${this.msg("World Size")}</span>
          <sl-switch
            size="small"
            .checked="${currentOption.locked}"
            @input="${() =>
              this.updateConfiguration(
                "initOptions.worldSize.locked",
                !currentOption.locked,
              )}"
          >
            ${this.msg("Lock")}
          </sl-switch>
        </div>
        <div class="world-size-inputs">
          <sl-input
            class=${invalidFields.has("worldSize.x") ? "invalid" : ""}
            type="number"
            min=${bounds["worldSize.x"].min}
            step=${bounds["worldSize.x"].step}
            label=${this.msg("W", { desc: "Short label for width" })}
            .value="${String(currentOption.value.x)}"
            @input="${createInputHandler((e) =>
              this.updateConfiguration(
                "initOptions.worldSize.value.x",
                Number(e),
              ),
            )}"
          ></sl-input>
          <sl-input
            class=${invalidFields.has("worldSize.y") ? "invalid" : ""}
            type="number"
            min=${bounds["worldSize.y"].min}
            step=${bounds["worldSize.y"].step}
            label=${this.msg("H", { desc: "Short label for height" })}
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

  render() {
    return html`
      <div id="pre-configuration-container">
        <h3 class="config-title">${this.msg("Configuration")}</h3>
        <sl-card>
          <h4>${this.msg("Initial Options")}</h4>
          <div class="config-container">
            ${this.renderInitOptionConfiguration(this.msg("Seed"), "seed")}
            ${this.renderWorldSizeConfiguration()}
            ${this.renderInitOptionConfiguration(
              this.msg("Initial Food Sources"),
              "initialFoodSourcesAmount",
            )}
            ${this.renderInitOptionConfiguration(
              this.msg("Initial Agents"),
              "initialAgentsAmount",
            )}
            ${this.renderInitOptionConfiguration(
              this.msg("Mutation Rate"),
              "mutationRate",
            )}
          </div>
        </sl-card>
        <sl-card>
          <div class="config-container">
            <h4>${this.msg("Graphs")}</h4>
            <sl-switch
              .checked="${this.configuration.graphs?.enabled ?? true}"
              @input="${() => this.toggleGraphOption("enabled")}"
            >
              ${this.msg("Enabled")}
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs?.showPopulationGraph ??
              true}"
              @input="${() => this.toggleGraphOption("showPopulationGraph")}"
            >
              ${this.msg("Show Population Graph")}
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs
                ?.showFoodAvailabilityGraph ?? true}"
              @input="${() =>
                this.toggleGraphOption("showFoodAvailabilityGraph")}"
            >
              ${this.msg("Show Food Availability Graph")}
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs?.showAlleleShareGraph ??
              true}"
              @input="${() => this.toggleGraphOption("showAlleleShareGraph")}"
            >
              ${this.msg("Show Allele Share Graph")}
            </sl-switch>
            <sl-switch
              .disabled="${!this.configuration.graphs?.enabled}"
              .checked="${this.configuration.graphs
                ?.showAlleleHistoricShareGraph ?? true}"
              @input="${() =>
                this.toggleGraphOption("showAlleleHistoricShareGraph")}"
            >
              ${this.msg("Show Allele Historic Share Graph")}
            </sl-switch>
          </div>
        </sl-card>
      </div>
    `;
  }
}
