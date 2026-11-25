import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { css } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";
import { html } from "@lit-labs/signals";
import {
  DEFAULT_SIMULATION_CONFIGURATION,
  SimulationConfiguration,
} from "./simulation-pre-configuration-aside";
import { SimulationInitOptions } from "../model/simulation/simulation.worker";
import { withValueAt } from "../model/deep";
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js";
import SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.component.js";
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js";
import IconPlus from "@tabler/icons/outline/plus.svg";
import { createInputHandler } from "./handle-input";
import {
  getInitOptionBounds,
  getInvalidInitOptionFields,
} from "../model/configuration-validation";

export class SimulationCreationDialog extends LitElementWw {
  protected readonly msg = widgetMsg(this);
  static readonly scopedElements = {
    "sl-dialog": SlDialog,
    "sl-input": SlInput,
    "sl-button": SlButton,
    "sl-icon": SlIcon,
  } as unknown as Record<string, CustomElementConstructor>;

  static readonly styles = css`
    sl-dialog::part(panel) {
      width: min(34rem, calc(100vw - 2rem));
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .intro {
      margin: 0;
      color: var(--sl-color-neutral-700, #374151);
    }

    .world-size-inputs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
    }

    sl-input.invalid {
      --sl-input-border-color: var(--sl-color-danger-600);
      --sl-input-border-color-hover: var(--sl-color-danger-600);
      --sl-input-border-color-focus: var(--sl-color-danger-600);
      --sl-input-focus-ring-color: var(--sl-color-danger-300);
    }

    .footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `;

  @property({ attribute: false })
  accessor simulationConfiguration!: SimulationConfiguration;

  @property({ attribute: false })
  accessor open = false;

  @state()
  private accessor draftConfiguration!: SimulationConfiguration;

  protected willUpdate(changedProperties: PropertyValues<this>) {
    const isOpening = changedProperties.has("open") && this.open;
    const configurationChangedWhileClosed =
      changedProperties.has("simulationConfiguration") && !this.open;

    if (isOpening || configurationChangedWhileClosed) {
      this.draftConfiguration = structuredClone(this.simulationConfiguration);
    }
  }

  private emitCreateNewSimulation(configuration: SimulationConfiguration) {

    this.dispatchEvent(
      new CustomEvent<SimulationConfiguration>("configuration-change", {
        detail: configuration,
        bubbles: true,
        composed: true,
      }),
    );
  }

  updateConfiguration(target: string, value: unknown) {
    this.draftConfiguration = withValueAt(this.draftConfiguration, target, value);
  }

  renderOptionConfigurator(
    label: string,
    option: Exclude<keyof SimulationInitOptions, "worldSize">,
  ) {
    const configurationValue =
      this.draftConfiguration.initOptions[option] ??
      DEFAULT_SIMULATION_CONFIGURATION.initOptions[option];
    const bounds =
      option === "seed"
        ? undefined
        : getInitOptionBounds(this.draftConfiguration.initOptions)[option];
    const isInvalid = getInvalidInitOptionFields(
      this.draftConfiguration.initOptions,
    ).has(option);

    return html`
      <sl-input
        class=${isInvalid ? "invalid" : ""}
        type=${option === "seed" ? "text" : "number"}
        label=${label}
        min=${ifDefined(bounds?.min)}
        max=${ifDefined(bounds?.max)}
        step=${ifDefined(bounds?.step)}
        .value=${String(configurationValue.value)}
        ?disabled=${configurationValue.locked}
        @input=${createInputHandler((value) =>
          this.updateConfiguration(
            `initOptions.${option}.value`,
            option === "seed" ? value : Number(value),
          ),
        )}
      ></sl-input>
    `;
  }

  renderWorldSizeConfigurator() {
    const configurationValue = this.draftConfiguration.initOptions.worldSize;
    const invalidFields = getInvalidInitOptionFields(
      this.draftConfiguration.initOptions,
    );
    const bounds = getInitOptionBounds(this.draftConfiguration.initOptions);

    return html`
      <div class="full-width">
        <label>${this.msg("World Size")}</label>
        <div class="world-size-inputs">
          <sl-input
            class=${invalidFields.has("worldSize.x") ? "invalid" : ""}
            type="number"
            min=${bounds["worldSize.x"].min}
            step=${bounds["worldSize.x"].step}
            label=${this.msg("W", { desc: "Short label for width" })}
            .value=${String(configurationValue.value.x)}
            ?disabled=${configurationValue.locked}
            @input=${createInputHandler((value) =>
              this.updateConfiguration(
                "initOptions.worldSize.value.x",
                Number(value),
              ),
            )}
          ></sl-input>
          <sl-input
            class=${invalidFields.has("worldSize.y") ? "invalid" : ""}
            type="number"
            min=${bounds["worldSize.y"].min}
            step=${bounds["worldSize.y"].step}
            label=${this.msg("H", { desc: "Short label for height" })}
            .value=${String(configurationValue.value.y)}
            ?disabled=${configurationValue.locked}
            @input=${createInputHandler((value) =>
              this.updateConfiguration(
                "initOptions.worldSize.value.y",
                Number(value),
              ),
            )}
          ></sl-input>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <sl-dialog
        label=${this.msg("Create Simulation")}
        .open=${this.open}
        @sl-hide=${() => {
          this.open = false;
          this.dispatchEvent(
            new CustomEvent("dialog-close", { bubbles: true, composed: true }),
          );
        }}
      >
        <div class="dialog-content">
          <p class="intro">
            ${this.msg("Create a new simulation with the following configuration:")}
          </p>

          ${this.renderOptionConfigurator(this.msg("Seed"), "seed")}
          ${this.renderWorldSizeConfigurator()}
          ${this.renderOptionConfigurator(
            this.msg("Initial Food Sources"),
            "initialFoodSourcesAmount",
          )}
          ${this.renderOptionConfigurator(
            this.msg("Initial Agents"),
            "initialAgentsAmount",
          )}
          ${this.renderOptionConfigurator(this.msg("Mutation Rate"), "mutationRate")}
        </div>
        <div slot="footer" class="footer">
          <sl-button @click=${() => (this.open = false)}
            >${this.msg("Cancel")}</sl-button
          >
          <sl-button
            variant="primary"
            ?disabled=${
              getInvalidInitOptionFields(this.draftConfiguration.initOptions)
                .size > 0
            }
            @click=${() => {
              this.open = false;
              this.emitCreateNewSimulation(this.draftConfiguration);
            }}
          >
            <sl-icon src=${IconPlus} slot="prefix"></sl-icon>
            ${this.msg("Create")}
          </sl-button>
        </div>
      </sl-dialog>
    `;
  }
}
