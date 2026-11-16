import { css, PropertyValues } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { property, query } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  ChartType,
  registerables,
} from "chart.js";
import { hasNoValue } from "../model/type-guards";

Chart.register(...registerables);

export class ChartWrapper extends LitElementWw {
  @property({ attribute: true })
  accessor type: ChartType = "line";

  @property({ attribute: false })
  accessor chartData: ChartData = { datasets: [] };

  @property({ attribute: false })
  accessor chartOptions: ChartOptions = {};

  @property({ attribute: true })
  accessor label = "Chart";

  @query("canvas")
  accessor canvas!: HTMLCanvasElement;

  private chart: Chart | null = null;

  static readonly styles = css`
    :host {
      display: block;
      min-height: var(--chart-height, 15rem);
    }

    .canvas-frame {
      height: var(--chart-height, 15rem);
      position: relative;
      width: 100%;
    }

    canvas {
      height: 100% !important;
      width: 100%;
    }
  `;

  private createChart() {
    const context = this.canvas.getContext("2d");

    if (hasNoValue(context)) {
      throw new Error("Could not create chart without a 2D canvas context");
    }

    this.chart = new Chart(context, {
      type: this.type,
      data: this.chartData,
      options: this.chartOptions,
    } as ChartConfiguration);
  }

  private updateChart() {
    if (hasNoValue(this.chart)) {
      return;
    }

    this.chart.data = this.chartData;
    this.chart.options = this.chartOptions;
    this.chart.update("none");
  }

  protected firstUpdated() {
    this.createChart();
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (hasNoValue(this.chart)) {
      return;
    }

    if (changedProperties.has("type")) {
      this.chart.destroy();
      this.createChart();
      return;
    }

    this.updateChart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.chart?.destroy();
    this.chart = null;
  }

  render() {
    return html`
      <div class="canvas-frame">
        <canvas aria-label=${this.label} role="img"></canvas>
      </div>
    `;
  }
}
