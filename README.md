# Evolution Sim (`@webwriter/evolution-sim@0.0.0`)
[License: MIT](LICENSE) | Version: 0.0.0

Simulate evolution with agents that search for food, reproduce and pass on mutating genes. Inspect individual agents and analyze population and gene distribution in charts.





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
| `simulationConfiguration` (`simulationConfiguration`) | `SimulationConfiguration` | Configuration of the simulation, serialized as JSON in the attribute.<br><br>- `initOptions`: Initial options of the simulation (`seed`, `worldSize`, `initialAgentsAmount`, `initialFoodSourcesAmount`, `mutationRate`). Each option is an object `{ value, locked }`. A locked option cannot be changed by users, e.g. when creating a new simulation.<br>- `graphs`: Which analysis charts are shown (`enabled`, `showPopulationGraph`, `showFoodAvailabilityGraph`, `showAlleleShareGraph`, `showAlleleHistoricShareGraph`). | `DEFAULT_SIMULATION_CONFIGURATION` | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Events
| Name | Description |
| :--: | :---------: |
| configuration-change | Fired when the configuration is changed in the options panel or when a new simulation is created. `detail` holds the new configuration. |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public methods, slots, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*