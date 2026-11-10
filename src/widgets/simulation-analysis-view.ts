import { localizeElement, LocalizedElement } from "../../localization/localizer";
import { consume } from "@lit/context";
import { css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { computed, html, signal, SignalWatcher } from "@lit-labs/signals";
import { ChartData, ChartOptions } from "chart.js";
import { SlCard, SlOption, SlSelect } from "@shoelace-style/shoelace";
import {
  SimulationStore,
  simulationStoreContext,
} from "@/composables/simulationStore";
import { definedGenes, GeneName } from "@/simulation/genetics/definitions";
import { ChartWrapper } from "./chart-wrapper";
import { getGeneTexts } from "./utils/geneTexts";
import type { MsgFn } from "@lit/localize";
import {
  createAlleleShareOverTimeSeries,
  createCurrentAlleleDistribution,
  createFoodAvailabilitySeries,
  createPopulationSeries,
  DEFAULT_HISTORY_SUBSET_PRESET,
  getAlleleColor,
  getHistorySubset,
  HISTORY_SUBSET_OPTIONS,
  HistorySubsetPreset,
} from "./utils/simulationAnalysis";
import { hasValue } from "@/utils/typeGuards";
import { isEmpty } from "lodash-es";

const DEFAULT_GENE_NAME: GeneName = definedGenes[0].name;

const formatShareTick = (value: string | number) =>
  `${Math.round(Number(value) * 100)}%`;

function createPopulationChartOptions(msg: MsgFn): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: msg("Tick"),
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: msg("Agents"),
        },
      },
    },
  };
}

function createFoodAvailabilityChartOptions(msg: MsgFn): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: msg("Tick"),
        },
      },
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: msg("Available food"),
        },
        ticks: {
          callback: formatShareTick,
        },
      },
    },
  };
}

function createAlleleShareLineOptions(msg: MsgFn): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: msg("Tick"),
        },
      },
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: msg("Allele share"),
        },
        ticks: {
          callback: formatShareTick,
        },
      },
    },
  };
}

function createCurrentDistributionOptions(msg: MsgFn): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: msg("Allele"),
        },
      },
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: msg("Current share"),
        },
        ticks: {
          callback: formatShareTick,
        },
      },
    },
  };
}

export interface GraphConfig {
  enabled: boolean;
  showPopulationGraph: boolean;
  showFoodAvailabilityGraph: boolean;
  showAlleleHistoricShareGraph: boolean;
  showAlleleShareGraph: boolean;
}

export const DEFAULT_GRAPH_OPTIONS = {
  enabled: true,
  showPopulationGraph: true,
  showFoodAvailabilityGraph: true,
  showAlleleHistoricShareGraph: true,
  showAlleleShareGraph: true,
};

@customElement("simulation-analysis-view")
export class SimulationAnalysisView extends SignalWatcher(LocalizedElement) {
  private readonly messageRevision = signal(0);
  protected readonly messages = localizeElement(this, () => {
    this.messageRevision.set(this.messageRevision.get() + 1);
  });
  @property({ attribute: false })
  accessor configuration: GraphConfig = DEFAULT_GRAPH_OPTIONS;

  @consume({ context: simulationStoreContext })
  private accessor simulationStore!: SimulationStore;

  private readonly selectedHistorySubsetPreset = signal<HistorySubsetPreset>(
    DEFAULT_HISTORY_SUBSET_PRESET,
  );
  private readonly selectedHistoryGene = signal<GeneName>(DEFAULT_GENE_NAME);
  private readonly selectedCurrentGene = signal<GeneName>(DEFAULT_GENE_NAME);

  private readonly historySubset = computed(() =>
    getHistorySubset(
      Array.from(this.simulationStore.simulationHistory),
      this.selectedHistorySubsetPreset.get(),
    ),
  );

  private readonly chartOptions = computed(() => {
    this.messageRevision.get();

    return {
      population: createPopulationChartOptions(this.messages.msg),
      foodAvailability: createFoodAvailabilityChartOptions(this.messages.msg),
      alleleShareLine: createAlleleShareLineOptions(this.messages.msg),
      currentDistribution: createCurrentDistributionOptions(this.messages.msg),
    };
  });

  private readonly populationChartData = computed<ChartData>(() => {
    this.messageRevision.get();

    return {
      datasets: [
        {
          label: this.messages.msg("Population"),
          data: createPopulationSeries(this.historySubset.get()),
          borderColor: "hsl(211, 86%, 46%)",
          backgroundColor: "hsla(211, 86%, 46%, 0.14)",
          fill: true,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    };
  });

  private readonly foodAvailabilityChartData = computed<ChartData>(() => {
    this.messageRevision.get();

    return {
      datasets: [
        {
          label: this.messages.msg("Available food"),
          data: createFoodAvailabilitySeries(this.historySubset.get()),
          borderColor: "hsl(142, 72%, 35%)",
          backgroundColor: "hsla(142, 72%, 35%, 0.14)",
          fill: true,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    };
  });

  private readonly alleleHistoryChartData = computed<ChartData>(() => {
    this.messageRevision.get();

    return {
      datasets: createAlleleShareOverTimeSeries({
        snapshots: this.historySubset.get(),
        geneName: this.selectedHistoryGene.get(),
      }).map((series) => ({
        label: `${this.messages.msg("Allele")}: ${series.allele}`,
        data: series.data,
        borderColor: getAlleleColor(series.allele),
        backgroundColor: getAlleleColor(series.allele),
        fill: false,
        pointRadius: 0,
        tension: 0.2,
      })),
    };
  });

  private readonly currentDistributionChartData = computed<ChartData>(() => {
    this.messageRevision.get();

    const snapshot =
      this.simulationStore.currentActiveSimulationData.get()?.snapshot ?? null;
    const distribution = createCurrentAlleleDistribution({
      snapshot,
      geneName: this.selectedCurrentGene.get(),
    });

    return {
      labels: distribution.map((entry) => String(entry.allele)),
      datasets: [
        {
          label: this.messages.msg("Current allele share"),
          data: distribution.map((entry) => entry.share),
          backgroundColor: distribution.map((entry) =>
            getAlleleColor(entry.allele),
          ),
        },
      ],
    };
  });

  static readonly scopedElements = {
    "chart-wrapper": ChartWrapper,
    "sl-card": SlCard,
    "sl-select": SlSelect,
    "sl-option": SlOption,
  };

  static readonly styles = css`
    #analysis-container {
      display: grid;
      width: 100%;
    }

    .warning {
      color: var(--sl-color-warning-700);
      font-size: 0.85rem;
      margin: 0.5rem 0 0;
      text-align: right;
    }

    .chart-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem;
      padding: 0 1rem 1rem;
    }

    .graph-panel {
      display: grid;
      gap: 0.75rem;
      min-width: 0;
      --chart-height: 14rem;
    }

    .chart-title {
      margin: 0;
      font-size: 1rem;
    }

    .controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    #header {
      gap: 1rem;
      padding: 1rem;
      align-items: center;
      justify-content: space-between;
    }
  `;

  private getSelectValue(event: Event) {
    return (event.target as unknown as { value: string }).value;
  }

  private handleHistorySubsetChange(event: Event) {
    this.selectedHistorySubsetPreset.set(
      this.getSelectValue(event) as HistorySubsetPreset,
    );
  }

  private handleHistoryGeneChange(event: Event) {
    this.selectedHistoryGene.set(this.getSelectValue(event) as GeneName);
  }

  private handleCurrentGeneChange(event: Event) {
    this.selectedCurrentGene.set(this.getSelectValue(event) as GeneName);
  }

  private renderGeneOptions() {
    return definedGenes.map(
      (gene) =>
        html`<sl-option value=${gene.name}
          >${getGeneTexts(gene.name, this.messages.msg).label}</sl-option
        >`,
    );
  }

  private populationHistoryGraph() {
    return html` <article class="graph-panel">
      <h3 class="chart-title">${this.messages.msg("Population development")}</h3>
      <chart-wrapper
        type="line"
        label=${this.messages.msg("Population development")}
        .data=${this.populationChartData.get()}
        .chartOptions=${this.chartOptions.get().population}
      ></chart-wrapper>
    </article>`;
  }

  private foodAvailabilityGraph() {
    return html` <article class="graph-panel">
      <h3 class="chart-title">${this.messages.msg("Food availability")}</h3>
      <chart-wrapper
        type="line"
        label=${this.messages.msg("Food availability")}
        .data=${this.foodAvailabilityChartData.get()}
        .chartOptions=${this.chartOptions.get().foodAvailability}
      ></chart-wrapper>
    </article>`;
  }

  private alleleShareOverTimeGraph() {
    return html` <article class="graph-panel">
      <h3 class="chart-title">${this.messages.msg("Gene distribution over time")}</h3>
      <div class="controls-row">
        <sl-select
          label=${this.messages.msg("Gene")}
          .value=${this.selectedHistoryGene.get()}
          @sl-change=${this.handleHistoryGeneChange}
        >
          ${this.renderGeneOptions()}
        </sl-select>
      </div>
      <chart-wrapper
        type="line"
        label=${this.messages.msg("Gene distribution over time")}
        .data=${this.alleleHistoryChartData.get()}
        .chartOptions=${this.chartOptions.get().alleleShareLine}
      ></chart-wrapper>
    </article>`;
  }

  private currentAlleleDistributionGraph() {
    return html` <article class="graph-panel">
      <h3 class="chart-title">${this.messages.msg("Current gene distribution")}</h3>
      <div class="controls-row">
        <sl-select
          label=${this.messages.msg("Gene")}
          .value=${this.selectedCurrentGene.get()}
          @sl-change=${this.handleCurrentGeneChange}
        >
          ${this.renderGeneOptions()}
        </sl-select>
      </div>
      <chart-wrapper
        type="bar"
        label=${this.messages.msg("Current gene distribution")}
        .data=${this.currentDistributionChartData.get()}
        .chartOptions=${this.chartOptions.get().currentDistribution}
      ></chart-wrapper>
    </article>`;
  }

  render() {
    const selectedHistorySubsetPreset = this.selectedHistorySubsetPreset.get();
    const selectedHistorySubsetOption = HISTORY_SUBSET_OPTIONS.find(
      (option) => option.value === selectedHistorySubsetPreset,
    );

    const {
      showAlleleHistoricShareGraph,
      showAlleleShareGraph,
      showFoodAvailabilityGraph,
      showPopulationGraph,
    } = this.configuration;

    const configuredGraphs = [
      showAlleleHistoricShareGraph ? this.alleleShareOverTimeGraph() : null,
      showAlleleShareGraph ? this.currentAlleleDistributionGraph() : null,
      showFoodAvailabilityGraph ? this.foodAvailabilityGraph() : null,
      showPopulationGraph ? this.populationHistoryGraph() : null,
    ].filter(hasValue);

    if (!this.configuration.enabled || isEmpty(configuredGraphs)) {
      return html``;
    }

    return html`
      <section id="analysis-container" aria-labelledby="analysis-heading">
        <div id="header">
          <sl-select
            class="history-control"
            label=${this.messages.msg("History window")}
            .value=${selectedHistorySubsetPreset}
            @sl-change=${this.handleHistorySubsetChange}
          >
            ${HISTORY_SUBSET_OPTIONS.map(
              (option) => html`
                <sl-option value=${option.value}
                  >${option.getLabel(this.messages.msg)}</sl-option
                >
              `,
            )}
          </sl-select>
          ${
            selectedHistorySubsetOption?.mayLag
              ? html`<p class="warning">
                  ${this.messages.msg("Full history may lag during long simulations.")}
                </p>`
              : null
          }
        </div>
        <div class="chart-grid">${configuredGraphs}</div>
      </section>
    `;
  }
}
