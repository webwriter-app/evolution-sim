import { css } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import {
  DEFAULT_SIMULATION_CONFIGURATION,
  SimulationConfiguration,
} from "./simulation-pre-configuration-aside";
import { SimulationInitOptions } from "@/simulation/Simulation.worker";
import { cloneDeep, set } from "lodash-es";
import { SlButton, SlDialog, SlIcon, SlInput } from "@shoelace-style/shoelace";
import { createInputHandler } from "@/utils/handleInput";

/* Optional LOCALIZATION: Uncomment this after first running `npm run localize` in the command line.
import LOCALIZE from '../localization/generated'
import {msg} from '@lit/localize'
*/

@customElement("simulation-creation-dialog")
export class SimulationCreationDialog extends SignalWatcher(LitElementWw) {
  /* Optional LOCALIZATION: Uncomment this after first running `npm run localize` in the command line.
  localize = LOCALIZE
  */

  /** Register the classes of custom elements to use in the Shadow DOM here.
   * @example
   * import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
   * ...
   *   static scopedElements = {"sl-button": SlButton}
   **/
  static readonly scopedElements = {
    "sl-dialog": SlDialog,
    "sl-input": SlInput,
    "sl-button": SlButton,
    "sl-icon": SlIcon,
  };

  /** Put the styles for your Shadow DOM (what is rendered through render()) here. */
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

  private emitCreateNewSimulation(configuration: SimulationConfiguration) {
    console.log(
      "INFO - Create new simulation with configuration (student)",
      configuration,
    );

    this.dispatchEvent(
      new CustomEvent<SimulationConfiguration>("configuration-change", {
        detail: configuration,
        bubbles: true,
        composed: true,
      }),
    );
  }

  updateConfiguration(target: string, value: unknown) {
    this.simulationConfiguration = set(
      cloneDeep(this.simulationConfiguration),
      target,
      value,
    );
  }

  renderOptionConfigurator(
    label: string,
    option: Exclude<keyof SimulationInitOptions, "worldSize">,
  ) {
    const configurationValue =
      this.simulationConfiguration.initOptions[option] ??
      DEFAULT_SIMULATION_CONFIGURATION.initOptions[option];
    const isMutationRateOption = option === "mutationRate";

    return html`
      <sl-input
        type=${option === "seed" ? "text" : "number"}
        label=${label}
        min=${ifDefined(isMutationRateOption ? "0" : undefined)}
        max=${ifDefined(isMutationRateOption ? "1" : undefined)}
        step=${ifDefined(isMutationRateOption ? "0.01" : undefined)}
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
    const configurationValue =
      this.simulationConfiguration.initOptions.worldSize;

    return html`
      <div class="full-width">
        <label>World Size</label>
        <div class="world-size-inputs">
          <sl-input
            type="number"
            label="W"
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
            type="number"
            label="H"
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

  /** Define your template here and return it. */
  render() {
    return html`
      <sl-dialog
        label="Create Simulation"
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
            Create a new simulation with the following configuration:
          </p>

          ${this.renderOptionConfigurator("Seed", "seed")}
          ${this.renderWorldSizeConfigurator()}
          ${this.renderOptionConfigurator(
            "Initial Food Sources",
            "initialFoodSourcesAmount",
          )}
          ${this.renderOptionConfigurator(
            "Initial Agents",
            "initialAgentsAmount",
          )}
          ${this.renderOptionConfigurator("Mutation Rate", "mutationRate")}
        </div>
        <div slot="footer" class="footer">
          <sl-button @click=${() => (this.open = false)}>Cancel</sl-button>
          <sl-button
            variant="primary"
            @click=${() => {
              this.open = false;
              this.emitCreateNewSimulation(this.simulationConfiguration);
            }}
          >
            <sl-icon name="plus" slot="prefix"></sl-icon>
            Create
          </sl-button>
        </div>
      </sl-dialog>
    `;
  }
}
