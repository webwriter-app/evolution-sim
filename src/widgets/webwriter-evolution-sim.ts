import { LitElementWw, computed } from "@webwriter/lit";
import { jsonData } from "@webwriter/lit/data";
import { localizer } from "@webwriter/lit/localize";
import { Permissions } from "@webwriter/lit/permissions";
import { css, nothing } from "lit";
import type { MsgFn } from "@lit/localize";
// @ts-ignore The Lit localization CLI emits the locale index as JavaScript.
import { sourceLocale, targetLocales } from "../../localization/generated/locale-codes.js";
import "@shoelace-style/shoelace/dist/themes/light.css";
import { customElement, state } from "lit/decorators.js";
import { SimulationRunView } from "../components/simulation-run-view";
import { SimulationCreationDialog } from "../components/simulation-creation-dialog";
import { html } from "@lit-labs/signals";
import { provide } from "@lit/context";
import {
  createSimulationStore,
  simulationStoreContext,
} from "../components/simulation-store";
import {
  ConfigurationChangeEvent,
  DEFAULT_SIMULATION_CONFIGURATION,
  SimulationConfiguration,
  SimulationPreConfigurationAside,
} from "../components/simulation-pre-configuration-aside";
import { SimulationInitOptions } from "../model/simulation/simulation.worker";
import { DEFAULT_MUTATION_RATE } from "../model/simulation/constants";
import { deepEqual } from "../model/deep";
import { hasValue } from "../model/type-guards";
import { createHistoryTable, historyTableToCsv } from "../model/history-table";
import { parseConfigurationFile } from "../model/configuration-file";

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
 * ### Signals
 *
 * Other widgets in the document can read these through `signals`:
 * - `population` (number): the number of agents in the current tick.
 * - `history` (table `{columns, rows}`): one row per recorded tick with
 *   `tick`, `population`, `food_sources`, `available_food_sources` and the
 *   mean allele of each gene (`mean_vision_range`, `mean_energy_capacity`;
 *   an empty cell when nobody is alive). A chart can take it with `data-from`.
 *   The history starts again with every new or reset simulation.
 *
 * ### Import and export
 *
 * - Export `text/csv`: the history table above. It is a snapshot of the running
 *   simulation and is not stored in the document.
 * - Export and import `.json`: the configuration in the format of the data
 *   block (`{"configuration": {...}}`). Import checks the whole file and starts
 *   a new simulation with it; the file is rejected if values are out of range.
 *
 * @csspart simulation - The container with the simulation world.
 *
 * @fires {CustomEvent<SimulationConfiguration>} configuration-change - Fired when the configuration is changed in the options panel or when a new simulation is created. `detail` holds the new configuration.
 */
@customElement("webwriter-evolution-sim")
export class WebwriterEvolutionSim extends LitElementWw {
  static readonly scopedElements = {
    "simulation-run-view": SimulationRunView,
    "simulation-pre-configuration-aside": SimulationPreConfigurationAside,
    "simulation-creation-dialog": SimulationCreationDialog,
  };

  static readonly styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: min(300px, 100%);
      max-width: 2100px;
      min-height: 14rem;
      color: var(--ww-text-color, inherit);
      font-family: var(--ww-font-family, inherit);
      border: solid 1px var(--sl-color-neutral-300);
      border-radius: var(--sl-border-radius-medium);
      box-sizing: border-box;
      overflow: hidden;
    }

    #configuration {
      width: min(30rem, calc(100% - 2rem));
      max-height: 85%;
      box-sizing: border-box;
    }

    #configuration form {
      text-align: end;
    }

    #root {
      display: flex;
      flex-direction: column;
      container-type: inline-size;
    }

    @media print {
      :host {
        break-inside: avoid;
        max-width: none;
      }

      #configuration {
        display: none;
      }
    }
  `;

  static readonly convertFrom = { ".json": "importConfiguration" };
  static readonly convertTo = { "text/csv": "exportHistoryCsv", ".json": "exportConfiguration" };

  static readonly actions = {
    configureSimulation: {
      label: (widget: { msg: MsgFn }) => widget.msg("Configure simulation"),
    },
  };

  // The labels of the actions are computed with `msg`, so the editor reads them again after a language change.
  protected override readonly localize = localizer(this, {
    sourceLocale,
    targetLocales,
    load: (locale) => import(`../../localization/generated/${locale}.ts`),
    prefer: { bn: "bn-BD", de: "de-DE", es: "es-ES", fa: "fa-IR", fr: "fr-FR", no: "nb", pt: "pt-PT" },
    drawer: true,
  });
  protected readonly msg = this.localize.msg;
  readonly #permissions = new Permissions(this);
  readonly #data = jsonData<{ configuration?: SimulationConfiguration }>(this, {
    defaults: {},
  });

  /** @internal */
  @provide({ context: simulationStoreContext })
  private accessor simulationStore = createSimulationStore();

  readonly signals = {
    population: computed(() => this.simulationStore.currentActiveSimulationData.get()?.snapshot.agents.length ?? 0),
    history: computed(() => createHistoryTable(Array.from(this.simulationStore.simulationHistory))),
  };

  private lastInitializedInitOptions: SimulationInitOptions | null = null;

  @state()
  private accessor isNewSimulationDialogOpen = false;

  configureSimulation() {
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>("#configuration");
    if (dialog && !dialog.open) dialog.showModal();
  }

  async importConfiguration(file: File) {
    let configuration: SimulationConfiguration;
    try {
      configuration = parseConfigurationFile(await file.text());
    } catch {
      throw new Error(this.msg("This is not a valid simulation configuration file."));
    }
    return () => this.saveConfiguration(configuration);
  }

  exportConfiguration() {
    return new File(
      [JSON.stringify({ configuration: this.simulationConfiguration }, null, 2)],
      "evolution-simulation.json",
      { type: "application/json" },
    );
  }

  exportHistoryCsv() {
    return new File(
      [historyTableToCsv(this.signals.history.get())],
      "evolution-history.csv",
      { type: "text/csv" },
    );
  }

  private get simulationConfiguration(): SimulationConfiguration {
    const { configuration } = this.#data.get();
    return configuration?.initOptions && configuration?.graphs
      ? configuration : DEFAULT_SIMULATION_CONFIGURATION;
  }

  private saveConfiguration(configuration: SimulationConfiguration) {
    this.#data.set({ configuration });
  }

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

  private initializeSimulationFromConfiguration({ force = false } = {}) {
    const initOptions = this.getSimulationInitOptions();

    if (!force && deepEqual(initOptions, this.lastInitializedInitOptions)) {
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

  updated() {
    this.initializeSimulationFromConfiguration();
  }

  render() {
    return html`
      <div id="root">
        <simulation-creation-dialog
          .simulationConfiguration=${this.simulationConfiguration}
          .open=${this.isNewSimulationDialogOpen}
          @configuration-change="${(e: ConfigurationChangeEvent) => {
            this.saveConfiguration(e.detail);
            this.isNewSimulationDialogOpen = false;
            this.initializeSimulationFromConfiguration({ force: true });
          }}"
          @dialog-close=${() => {
            this.isNewSimulationDialogOpen = false;
          }}
        ></simulation-creation-dialog>

        <simulation-run-view
          .configuration=${this.simulationConfiguration}
          @open-new-simulation-dialog=${() => {
            this.isNewSimulationDialogOpen = true;
          }}
        ></simulation-run-view>

        ${
          this.#permissions.editing
            ? html`<dialog id="configuration" aria-label=${this.msg("Configuration")}>
                <form method="dialog"><button>${this.msg("Close")}</button></form>
                <simulation-pre-configuration-aside
                  .configuration=${this.simulationConfiguration}
                  @configuration-change=${(e: ConfigurationChangeEvent) => this.saveConfiguration(e.detail)}
                ></simulation-pre-configuration-aside>
              </dialog>`
            : nothing
        }
      </div>
    `;
  }
}
