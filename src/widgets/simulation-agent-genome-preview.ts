import { css } from "lit";
import type { PropertyValues } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import { Application } from "pixi.js";
import { Genome } from "@/simulation/genetics/genome";
import { SIMULATION_TILE_SIZE } from "@/simulation/rendering";
import { hasNoValue } from "@/utils/typeGuards";
import { loadTextures } from "./assets";
import { GenomeRenderer } from "./utils/geneRendering";

const PREVIEW_SIZE = 96;
const MAX_GENE_SCALE = 1.5;

@customElement("simulation-agent-genome-preview")
export class SimulationAgentGenomePreview extends LitElementWw {
  @property({ attribute: false })
  accessor genome: Genome = [];

  @query("#preview-container")
  accessor previewContainer!: HTMLDivElement;

  private app: Application | null = null;

  static readonly styles = css`
    #preview-container {
      display: block;
      width: 4rem;
      height: 4rem;
    }

    #preview-container canvas {
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
  `;

  private renderGenome() {
    if (hasNoValue(this.app)) {
      return;
    }

    this.app.stage.removeChildren();

    const genomeRenderer = new GenomeRenderer(this.genome);
    const previewScale = PREVIEW_SIZE / (SIMULATION_TILE_SIZE * MAX_GENE_SCALE);

    genomeRenderer.root.scale.set(previewScale);
    genomeRenderer.root.position.set(
      PREVIEW_SIZE / 2 - (SIMULATION_TILE_SIZE * previewScale) / 2,
      PREVIEW_SIZE / 2 - (SIMULATION_TILE_SIZE * previewScale) / 2,
    );

    this.app.stage.addChild(genomeRenderer.root);
  }

  render() {
    return html`<div
      id="preview-container"
      aria-label="Agent genome preview"
    ></div>`;
  }

  async firstUpdated() {
    await loadTextures();

    const app = new Application();

    await app.init({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      backgroundAlpha: 0,
      antialias: false,
    });

    if (!this.isConnected) {
      app.destroy();
      return;
    }

    this.previewContainer.appendChild(app.canvas);
    this.app = app;
    this.renderGenome();
  }

  updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("genome")) {
      this.renderGenome();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.app?.destroy();
    this.app = null;
  }
}
