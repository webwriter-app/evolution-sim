import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import { SimulationStateRender } from "./simulation-state-render";
import {
  ModeChangeEvent,
  SimulationControlsBar,
  SimulationViewMode,
} from "./simulation-controls-bar";
import { SignalWatcher, html } from "@lit-labs/signals";
import { SimulationManualTools } from "./simulation-manual-tools";
import { SimulationMutationRateEditor } from "./simulation-mutation-rate-editor";
import { SimulationEntityView } from "./simulation-entity-view";
import {
  DEFAULT_GRAPH_OPTIONS,
  SimulationAnalysisView,
} from "./simulation-analysis-view";
import { SimulationConfiguration } from "./simulation-pre-configuration-aside";
import { localized } from "@lit/localize";

@customElement("simulation-run-view")
@localized()
export class SimulationRunView extends SignalWatcher(LitElementWw) {
  @property({ attribute: false })
  accessor configuration: Partial<SimulationConfiguration> | null = null;

  @state()
  private accessor mode: SimulationViewMode = "simulation";

  private readonly widgetId = crypto.randomUUID();

  static scopedElements = {
    "simulation-state-render": SimulationStateRender,
    "simulation-controls-bar": SimulationControlsBar,
    "simulation-manual-tools": SimulationManualTools,
    "simulation-mutation-rate-editor": SimulationMutationRateEditor,
    "simulation-entity-view": SimulationEntityView,
    "simulation-analysis-view": SimulationAnalysisView,
  };

  static styles = css`
    simulation-controls-bar {
      border-bottom: solid 1px var(--sl-color-neutral-300);
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .content[hidden] {
      display: none;
    }

    #bottom-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    simulation-entity-view,
    simulation-mutation-rate-editor,
    simulation-analysis-view {
      width: 100%;
    }
  `;

  private getMutationRateLocked() {
    return this.configuration?.initOptions?.mutationRate?.locked ?? false;
  }

  render() {
    const graphConfiguration =
      this.configuration?.graphs ?? DEFAULT_GRAPH_OPTIONS;
    const graphsEnabled = graphConfiguration.enabled;
    const mode = graphsEnabled ? this.mode : "simulation";

    return html`
      <simulation-controls-bar
        .mode=${mode}
        ?showModeSelect=${graphsEnabled}
        @mode-change=${(e: ModeChangeEvent) => {
          this.mode = e.detail;
        }}
      ></simulation-controls-bar>

      <div class="content" ?hidden=${mode !== "simulation"}>
        <simulation-state-render
          .widgetId=${this.widgetId}
        ></simulation-state-render>
        <div id="bottom-bar">
          <simulation-mutation-rate-editor
            .locked=${this.getMutationRateLocked()}
          ></simulation-mutation-rate-editor>
          <simulation-manual-tools
            .widgetId=${this.widgetId}
          ></simulation-manual-tools>
          <simulation-entity-view></simulation-entity-view>
        </div>
      </div>

      ${when(
        graphsEnabled,
        () => html`
          <div class="content" ?hidden=${mode !== "graphs"}>
            <simulation-analysis-view
              .configuration=${graphConfiguration}
            ></simulation-analysis-view>
          </div>
        `,
      )}
    `;
  }
}
