import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SignalWatcher, html } from "@lit-labs/signals";
import { SlInput, SlRange } from "@shoelace-style/shoelace";
import { useSimulationStore } from "@/composables/simulationStore";
import { DEFAULT_MUTATION_RATE } from "@/simulation/constants";
import { createInputHandler } from "@/utils/handleInput";

@customElement("simulation-mutation-rate-editor")
export class SimulationMutationRateEditor extends SignalWatcher(LitElementWw) {
  simulationStore = useSimulationStore();

  @property({ type: Boolean })
  accessor locked = false;

  static scopedElements = {
    "sl-input": SlInput,
    "sl-range": SlRange,
  };

  static styles = css`
    #mutation-rate-editor {
      display: grid;
      grid-template-columns: auto 7rem minmax(10rem, 18rem);
      gap: 0.75rem;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    label {
      color: var(--sl-color-neutral-700, #374151);
      font-size: var(--sl-font-size-small, 0.875rem);
      white-space: nowrap;
    }

    sl-input,
    sl-range {
      width: 100%;
    }
  `;

  render() {
    const activeSimulationData =
      this.simulationStore.currentActiveSimulationData.get();
    const hasActiveSimulation = activeSimulationData !== null;
    const disabled = !hasActiveSimulation || this.locked;
    const mutationRate =
      activeSimulationData?.metadata.mutationRate ?? DEFAULT_MUTATION_RATE;

    return html`
      <div id="mutation-rate-editor">
        <label for="mutation-rate-input">Mutation Rate</label>
        <sl-input
          id="mutation-rate-input"
          aria-label="Mutation Rate"
          type="number"
          min="0"
          max="1"
          step="0.01"
          .value=${String(mutationRate)}
          ?disabled=${disabled}
          @input=${createInputHandler((value) =>
            this.simulationStore.setMutationRate(Number(value)),
          )}
        ></sl-input>
        <sl-range
          aria-label="Mutation Rate"
          min="0"
          max="1"
          step="0.01"
          tooltip="top"
          .value=${mutationRate}
          ?disabled=${disabled}
          @input=${createInputHandler((value) =>
            this.simulationStore.setMutationRate(Number(value)),
          )}
        ></sl-range>
      </div>
    `;
  }
}
