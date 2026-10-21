import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import { SlCard, SlProgressBar } from "@shoelace-style/shoelace";
import { localized, msg } from "@lit/localize";
import { Genome } from "@/simulation/genetics/genome";
import { getDefinedGene } from "@/simulation/genetics/definitions";
import { getGeneTexts } from "./utils/geneTexts";

@customElement("simulation-gene-card")
@localized()
export class SimulationGeneCard extends LitElementWw {
  @property({ attribute: false })
  accessor entry: Genome[number] | null = null;

  static readonly scopedElements = {
    "sl-card": SlCard,
    "sl-progress-bar": SlProgressBar,
  };

  static readonly styles = css`
    .gene-card::part(body) {
      display: grid;
      gap: 0.75rem;
    }

    .gene-header {
      display: flex;
      align-items: baseline;
    }

    .gene-name {
      font-size: 1rem;
      margin: 0;
    }

    .gene-description {
      color: var(--sl-color-neutral-700);
      line-height: 1.4;
      margin: 0;
    }

    .allele-range {
      display: grid;
      gap: 0.4rem;
    }

    .current-allele {
      color: var(--sl-color-neutral-800);
      font-weight: var(--sl-font-weight-semibold);
      text-align: center;
    }

    .allele-range-labels {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 1rem;
      color: var(--sl-color-neutral-600);
      font-size: 0.85rem;
    }

    .max-label {
      text-align: right;
    }

    sl-progress-bar::part(base) {
      height: 0.65rem;
    }
  `;

  private getAlleleProgress({
    allele,
    min,
    max,
  }: {
    allele: number;
    min: number;
    max: number;
  }) {
    if (max === min) {
      return 100;
    }

    const progress = ((allele - min) / (max - min)) * 100;

    return Math.min(100, Math.max(0, progress));
  }

  render() {
    if (!this.entry) {
      return null;
    }

    const gene = getDefinedGene(this.entry.geneName);
    const geneTexts = getGeneTexts(gene.name);
    const alleleProgress = this.getAlleleProgress({
      allele: this.entry.allele,
      min: gene.min,
      max: gene.max,
    });

    return html`
      <sl-card class="gene-card">
        <div class="gene-header">
          <h3 class="gene-name">${geneTexts.label}</h3>
        </div>
        <p class="gene-description">${geneTexts.description}</p>
        <div
          class="allele-range"
          aria-label=${msg("Allele within possible range")}
        >
          <sl-progress-bar value=${alleleProgress}></sl-progress-bar>
          <div class="allele-range-labels">
            <span>${msg("Min")} ${gene.min}</span>
            <span class="current-allele"
              >${msg("Current")}: ${this.entry.allele}</span
            >
            <span class="max-label">${msg("Max")} ${gene.max}</span>
          </div>
        </div>
      </sl-card>
    `;
  }
}
