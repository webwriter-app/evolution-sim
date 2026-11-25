import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { property } from "lit/decorators.js";
import { html } from "@lit-labs/signals";
import { Genome } from "../model/simulation/genetics/genome";
import { SimulationGeneCard } from "./simulation-gene-card";

export class SimulationAgentGeneticsTab extends LitElementWw {
  @property({ attribute: false })
  accessor genome: Genome = [];

  static readonly scopedElements = {
    "simulation-gene-card": SimulationGeneCard,
  };

  static readonly styles = css`
    .gene-list {
      display: grid;
      gap: 0.75rem;
      margin-top: 1rem;
    }
  `;

  render() {
    return html`
      <div class="gene-list">
        ${this.genome.map(
          (entry) =>
            html`<simulation-gene-card .entry=${entry}></simulation-gene-card>`,
        )}
      </div>
    `;
  }
}
