# Evolution Sim (`@webwriter/evolution-sim@2.1.1`)
[License: MIT](LICENSE) | Version: 2.1.1

Explore evolution and natural selection through interactive simulations.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Island Evolution | `@webwriter/evolution-sim/snippets/island-evolution.html` |



## `WebwriterEvolutionSim` (`<webwriter-evolution-sim>`)
Agent-based simulation of evolution: agents search for food, reproduce and
pass on mutating genes. The widget renders the simulated world, lets users
inspect individual agents and their ancestry, and charts the population and
gene distribution over time.

### Agent behavior

An agent's behavior is determined by its phenotype. From the phenotype, the
agent's strategy, behaviors and actions are derived. The agent's strategy is
the top level of an agent's behavioral pyramid. It consists of a set of
states and transitions between those states. Each state holds a behavior,
which is executed each tick as long as the agent is in that state. The
transitions are based on the agent's inner and perceived external state. A
behavior is a composition of actions and simple logic, based on the agent's
inner and perceived external state. An action is the most basic unit of
behavior.

### Signals

Other widgets in the document can read these through `signals`:
- `population` (number): the number of agents in the current tick.
- `history` (table `{columns, rows}`): one row per recorded tick with
  `tick`, `population`, `food_sources`, `available_food_sources` and the
  mean allele of each gene (`mean_vision_range`, `mean_energy_capacity`;
  an empty cell when nobody is alive). A chart can take it with `data-from`.
  The history starts again with every new or reset simulation.

### Import and export

- Export `text/csv`: the history table above. It is a snapshot of the running
  simulation and is not stored in the document.
- Export and import `.json`: the configuration in the format of the data
  block (`{"configuration": {...}}`). Import checks the whole file and starts
  a new simulation with it; the file is rejected if values are out of range.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/evolution-sim/widgets/webwriter-evolution-sim.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/evolution-sim/widgets/webwriter-evolution-sim.js"></script>
<webwriter-evolution-sim></webwriter-evolution-sim>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/evolution-sim
```

```html
<link href="@webwriter/evolution-sim/widgets/webwriter-evolution-sim.css" rel="stylesheet">
<script type="module" src="@webwriter/evolution-sim/widgets/webwriter-evolution-sim.js"></script>
<webwriter-evolution-sim></webwriter-evolution-sim>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WebwriterEvolutionSim.scopedElements` | `object` | - | `{ "simulation-run-view": SimulationRunView, "simulation-pre-configuration-aside": SimulationPreConfigurationAside, "simulation-creation-dialog": SimulationCreationDialog, }` | ✗ |
| `WebwriterEvolutionSim.convertFrom` | `object` | - | `{ ".json": "importConfiguration" }` | ✗ |
| `WebwriterEvolutionSim.convertTo` | `object` | - | `{ "text/csv": "exportHistoryCsv", ".json": "exportConfiguration" }` | ✗ |
| `WebwriterEvolutionSim.actions` | `object` | - | `{ configureSimulation: { label: (widget: { msg: MsgFn }) => widget.msg("Configure simulation"), }, }` | ✗ |
| `signals` | `object` | - | `{ population: computed(() => this.simulationStore.currentActiveSimulationData.get()?.snapshot.agents.length ?? 0), history: computed(() => createHistoryTable(Array.from(this.simulationStore.simulationHistory))), }` | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `configureSimulation` | - | -
| `importConfiguration` | - | `file: File`
| `exportConfiguration` | - | -
| `exportHistoryCsv` | - | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Events
| Name | Description |
| :--: | :---------: |
| configuration-change | Fired when the configuration is changed in the options panel or when a new simulation is created. `detail` holds the new configuration. |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## CSS parts
| Name | Description |
| :--: | :---------: |
| simulation | The container with the simulation world. |

*[CSS parts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_shadow_parts) allow freely styling internals of the widget with CSS.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `importFormats` | `.json` |
| `exportFormats` | `text/csv,.json` |
| `label` | `[object Object]` |

*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, or custom CSS properties.*


---
*Generated with @webwriter/build@1.15.0*
