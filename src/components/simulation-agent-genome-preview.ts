import { LitElementWw } from "@webwriter/lit";
import { widgetMsg } from "@webwriter/lit/localize";
import { css } from "lit";
import type { PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import { Application } from "pixi.js";
import { Genome } from "../model/simulation/genetics/genome";
import { SIMULATION_TILE_SIZE } from "../model/simulation/rendering";
import { hasNoValue, hasValue } from "../model/type-guards";
import { loadTextures } from "./textures";
import { GenomeRenderer } from "./gene-rendering";

const PREVIEW_SIZE = 96;
const MAX_GENE_SCALE = 1.5;

export class SimulationAgentGenomePreview extends LitElementWw {
  protected readonly msg = widgetMsg(this);
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
      aria-label=${this.msg("Agent genome preview")}
    ></div>`;
  }

  connectedCallback() {
    super.connectedCallback();

    // The shadow DOM survives a move in the document; only the app was torn down.
    if (this.hasUpdated) void this.setupCanvas();
  }

  firstUpdated() {
    void this.setupCanvas();
  }

  private async setupCanvas() {
    await loadTextures();

    const app = new Application();

    await app.init({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      backgroundAlpha: 0,
      antialias: false,
    });

    if (!this.isConnected || hasValue(this.app)) {
      app.destroy({ removeView: true });
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

    this.app?.destroy({ removeView: true });
    this.app = null;
  }
}
