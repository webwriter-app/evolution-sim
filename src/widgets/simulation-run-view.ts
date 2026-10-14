import { css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property } from "lit/decorators.js";
import { SimulationStateRender } from "./simulation-state-render";
import { SimulationControlsBar } from "./simulation-controls-bar";
import { SignalWatcher, html } from "@lit-labs/signals";
import { SimulationManualTools } from "./simulation-manual-tools";
import { SimulationMutationRateEditor } from "./simulation-mutation-rate-editor";
import { SimulationEntityView } from "./simulation-entity-view";
import {
  DEFAULT_GRAPH_OPTIONS,
  SimulationAnalysisView,
} from "./simulation-analysis-view";
import { SimulationConfiguration } from "./simulation-pre-configuration-aside";
import { SlTab, SlTabGroup, SlTabPanel } from "@shoelace-style/shoelace";
import { localized, msg } from "@lit/localize";

@customElement("simulation-run-view")
@localized()
export class SimulationRunView extends SignalWatcher(LitElementWw) {
  @property({ attribute: false })
  accessor configuration: Partial<SimulationConfiguration> | null = null;

  private readonly widgetId = crypto.randomUUID();

  /** Register the classes of custom elements to use in the Shadow DOM here.
   * @example
   * import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
   * ...
   *   static scopedElements = {"sl-button": SlButton}
   **/
  static scopedElements = {
    "simulation-state-render": SimulationStateRender,
    "simulation-controls-bar": SimulationControlsBar,
    "simulation-manual-tools": SimulationManualTools,
    "simulation-mutation-rate-editor": SimulationMutationRateEditor,
    "simulation-entity-view": SimulationEntityView,
    "simulation-analysis-view": SimulationAnalysisView,
    "sl-tab": SlTab,
    "sl-tab-group": SlTabGroup,
    "sl-tab-panel": SlTabPanel,
  };

  /** Put the styles for your Shadow DOM (what is rendered through render()) here. */
  static styles = css`
    #root {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .simulation-tab-content,
    .graphs-tab-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }

    #bottom-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    simulation-entity-view,
    simulation-controls-bar,
    simulation-mutation-rate-editor,
    simulation-analysis-view {
      width: 100%;
    }
  `;

  private getMutationRateLocked() {
    return this.configuration?.initOptions?.mutationRate?.locked ?? false;
  }

  private renderSimulationTabContent() {
    return html`
      <div class="simulation-tab-content">
        <simulation-controls-bar></simulation-controls-bar>
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
    `;
  }

  private renderGraphsTabContent() {
    return html`
      <div class="graphs-tab-content">
        <simulation-controls-bar></simulation-controls-bar>
        <simulation-analysis-view
          .configuration=${this.configuration?.graphs ?? DEFAULT_GRAPH_OPTIONS}
        ></simulation-analysis-view>
      </div>
    `;
  }

  /** Define your template here and return it. */
  render() {
    const graphConfiguration =
      this.configuration?.graphs ?? DEFAULT_GRAPH_OPTIONS;

    if (graphConfiguration.enabled) {
      return html`
        <div>
          <sl-tab-group>
            <sl-tab slot="nav" panel="simulation">${msg("Simulation")}</sl-tab>
            <sl-tab slot="nav" panel="graphs">${msg("Graphs")}</sl-tab>

            <sl-tab-panel name="simulation">
              ${this.renderSimulationTabContent()}
            </sl-tab-panel>

            <sl-tab-panel name="graphs">
              ${this.renderGraphsTabContent()}
            </sl-tab-panel>
          </sl-tab-group>
        </div>
      `;
    } else {
      return html` <div id="root">${this.renderSimulationTabContent()}</div> `;
    }
  }
}
