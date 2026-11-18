/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import "../src/widgets/webwriter-evolution-sim";
import snippet from "../snippets/island-evolution.html";
import configurationFixture from "./fixtures/configuration.json";
import { dataBlockOf, deepQuery, setEditMode, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("<webwriter-evolution-sim>", function () {
  this.timeout(30000);
  let widget: any;

  const root = () => widget.shadowRoot as ShadowRoot;
  const runView = () => root()?.querySelector("simulation-run-view") as any;
  const controls = () => runView()?.shadowRoot?.querySelector("simulation-controls-bar");
  const dataBlock = () => widget.querySelector(':scope > script[type="application/json"][slot="data"]') as HTMLScriptElement;
  const buttonLabelled = (text: string) =>
    [...controls().shadowRoot.querySelectorAll("sl-button")].find((b: any) => b.textContent.trim() === text) as HTMLElement | undefined;
  const store = () => widget.simulationStore;

  beforeEach(async function () {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<webwriter-evolution-sim id="sim">${dataBlockOf(snippet)}</webwriter-evolution-sim>`,
    );
    widget = document.getElementById("sim");
    await until("simulation ready", () => store()?.simulationStatus.get() === "ready");
  });

  afterEach(function () {
    document.designMode = "off";
    widget?.remove();
  });

  describe("modes", function () {
    it("a reader gets no configuration dialog", function () {
      assert.isNull(root().querySelector("#configuration"));
    });

    it("the configuration dialog appears in edit mode and goes away again", async function () {
      setEditMode(widget, true);
      await until("dialog in edit mode", () => root().querySelector("#configuration"));
      assert.isNotNull(root().querySelector("#configuration simulation-pre-configuration-aside"));
      setEditMode(widget, false);
      await until("dialog removed in read mode", () => !root().querySelector("#configuration"));
    });

    it("configureSimulation opens the dialog in edit mode", async function () {
      setEditMode(widget, true);
      await until("dialog", () => root().querySelector("#configuration"));
      widget.configureSimulation();
      const dialog = root().querySelector("#configuration") as any;
      assert.isTrue(dialog.open);
      dialog.close();
    });
  });

  describe("data block", function () {
    it("configures the run view", function () {
      assert.equal(runView().configuration.initOptions.seed.value, "island");
      assert.equal(store().currentActiveSimulationData.get().metadata.worldSize.x, 50);
    });

    it("an outside change updates the widget and starts a new simulation", async function () {
      const next = JSON.parse(dataBlock().textContent!);
      next.configuration.initOptions.worldSize.value = { x: 30, y: 20 };
      next.configuration.initOptions.seed.value = "other";
      dataBlock().textContent = JSON.stringify(next);
      await until("run view configuration", () => runView().configuration.initOptions.seed.value === "other");
      await until("new world", () => store().currentActiveSimulationData.get().metadata.worldSize.x === 30);
      assert.equal(store().currentActiveSimulationData.get().metadata.worldSize.y, 20);
    });

    it("a missing or incomplete configuration falls back to the defaults", async function () {
      const next = JSON.parse(dataBlock().textContent!);
      next.configuration.initOptions.seed.value = "other";
      dataBlock().textContent = JSON.stringify(next);
      await until("changed", () => runView().configuration.initOptions.seed.value === "other");
      dataBlock().textContent = "{}";
      await until("defaults", () => runView().configuration.initOptions.seed.value !== "other");
      dataBlock().textContent = JSON.stringify({ configuration: { initOptions: null } });
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.isNotNull(runView().configuration.initOptions, "configuration without initOptions was used");
    });

    it("saving a configuration writes one data block in the old format", async function () {
      setEditMode(widget, true);
      const aside = await until("aside", () => root().querySelector("simulation-pre-configuration-aside"));
      const configuration = JSON.parse(JSON.stringify(runView().configuration));
      configuration.initOptions.seed.value = "a<b";
      configuration.initOptions.initialAgentsAmount.value = 7;
      aside.dispatchEvent(new CustomEvent("configuration-change", { detail: configuration, bubbles: true, composed: true }));
      await until("block text", () => dataBlock()?.textContent!.includes("initialAgentsAmount"));
      assert.equal(widget.querySelectorAll(":scope > script").length, 1, "number of data blocks");
      assert.equal(dataBlock().getAttribute("type"), "application/json");
      assert.equal(dataBlock().getAttribute("slot"), "data");
      assert.isFalse(dataBlock().textContent!.includes("<"), "unescaped <");
      const stored = JSON.parse(dataBlock().textContent!);
      assert.equal(Object.keys(stored).join(), "configuration");
      assert.equal(stored.configuration.initOptions.seed.value, "a<b");
      assert.equal(stored.configuration.initOptions.initialAgentsAmount.value, 7);
      assert.equal(runView().configuration.initOptions.initialAgentsAmount.value, 7);
    });
  });

  describe("run controls", function () {
    it("start, pause, step and reset work", async function () {
      await until("ready", () => ["ready", "paused"].includes(store().simulationStatus.get()));
      buttonLabelled("Start")!.click();
      await until("running", () => store().simulationStatus.get() === "running");
      const tick = store().currentActiveSimulationData.get().snapshot.tick;
      await until("ticks advance", () => store().currentActiveSimulationData.get().snapshot.tick > tick + 1);
      await until("pause label", () => buttonLabelled("Pause"));
      buttonLabelled("Pause")!.click();
      await until("paused", () => store().simulationStatus.get() === "paused");
      const paused = store().currentActiveSimulationData.get().snapshot.tick;
      buttonLabelled("Step")!.click();
      await until("one step", () => store().currentActiveSimulationData.get().snapshot.tick === paused + 1);
      buttonLabelled("Reset")!.click();
      await until("reset", () => store().simulationStatus.get() === "ready" && store().currentActiveSimulationData.get().snapshot.tick === 0);
    });

    it("Escape cancels the manual tool", function () {
      store().setActiveManualTool("remove-entity");
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      assert.isNull(store().activeManualTool.get());
    });
  });

  describe("moving in the document", function () {
    it("the canvas is rebuilt once and the key listener is not doubled", async function () {
      const render = () => deepQuery(widget.shadowRoot, "simulation-state-render") as any;
      const first = await until("canvas app", () => render()?.app);
      document.body.append(widget);
      const second = await until("rebuilt app", () => render().app && render().app !== first && render().app);
      await until("simulation shown", () => render().currentWorldSize);
      assert.equal(render().shadowRoot.querySelectorAll("canvas").length, 1, "canvases after the move");
      assert.isNotNull(second.canvas.parentElement, "new canvas is attached");
      store().setActiveManualTool("remove-entity");
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      assert.isNull(store().activeManualTool.get());
    });
  });

  describe("input, layout and theme", function () {
    const stateRender = () => runView().shadowRoot.querySelector("simulation-state-render") as any;
    const container = () => stateRender().shadowRoot.querySelector("#simulation-container") as HTMLElement;
    const toolButton = (text: string) =>
      [...runView().shadowRoot.querySelector("simulation-manual-tools").shadowRoot.querySelectorAll("sl-button")].find(
        (b: any) => b.textContent.trim() === text,
      ) as HTMLElement;
    const key = (k: string) => container().dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const counts = () => {
      const snapshot = store().currentActiveSimulationData.get().snapshot;
      return { agents: snapshot.agents.length, food: snapshot.foodSources.length };
    };

    beforeEach(async function () {
      await until("canvas", () => stateRender().app && stateRender().currentWorldSize);
    });

    it("the world is a focusable group with a label", function () {
      assert.equal(container().tabIndex, 0);
      assert.equal(container().getAttribute("role"), "group");
      assert.isNotEmpty(container().getAttribute("aria-label"));
    });

    it("arrow keys move the cursor and Enter selects an entity", async function () {
      const target = store().currentActiveSimulationData.get().snapshot.foodSources[0].position;
      container().focus();
      await until("cursor", () => stateRender().cursorTile);
      stateRender().setCursorTile({ x: Math.max(0, target.x - 1), y: target.y });
      const before = stateRender().cursorTile;
      key("ArrowRight");
      const after = stateRender().cursorTile;
      assert.equal(after.x, Math.min(before.x + 1, stateRender().currentWorldSize.x - 1));
      key("Enter");
      await until("selection", () => store().currentSelection.get());
    });

    it("a tool button toggles an add tool and a tap on the world places the entity", async function () {
      toolButton("Food Source").click();
      assert.equal(store().activeManualTool.get(), "add-food-source");
      await until("pressed state", () => toolButton("Food Source").getAttribute("aria-pressed") === "true");
      const before = counts().food;
      const bounds = container().getBoundingClientRect();
      const init = { clientX: bounds.left + 3, clientY: bounds.top + 3, pointerType: "touch", bubbles: true };
      container().dispatchEvent(new PointerEvent("pointerdown", init));
      container().dispatchEvent(new PointerEvent("pointerup", init));
      container().dispatchEvent(new MouseEvent("click", init));
      await until("food source added", () => counts().food > before);
      toolButton("Food Source").click();
      assert.isNull(store().activeManualTool.get());
    });

    it("Enter places an agent with the agent tool", async function () {
      toolButton("Agent").click();
      container().focus();
      await until("cursor", () => stateRender().cursorTile);
      key("ArrowUp");
      key("ArrowUp");
      const before = counts().agents;
      key("Enter");
      await until("agent added", () => counts().agents > before);
    });

    it("beforeprint stores a still image of the world for the print view", async function () {
      const image = stateRender().shadowRoot.querySelector("#print-image") as HTMLImageElement;
      window.dispatchEvent(new Event("beforeprint"));
      assert.match(image.getAttribute("src") ?? "", /^data:image\/png;base64,/);
      assert.equal(getComputedStyle(image).display, "none");
    });

    it("the widget stays within 300 to 2100 pixels and follows the theme", async function () {
      const style = getComputedStyle(widget);
      assert.equal(style.maxWidth, "2100px");
      assert.match(style.minWidth, /300px/);
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "--ww-text-color: rgb(1, 2, 3); --ww-font-family: monospace; --ww-theme-accent-1: rgb(9, 8, 7)";
      widget.replaceWith(wrapper);
      wrapper.append(widget);
      assert.equal(getComputedStyle(widget).color, "rgb(1, 2, 3)");
      assert.include(getComputedStyle(widget).fontFamily, "monospace");
      const { getAlleleColor } = await import("../src/components/simulation-analysis");
      assert.equal(getAlleleColor(0, widget), "rgb(9, 8, 7)");
      assert.equal(getAlleleColor(0), "#1f77b4");
      wrapper.replaceWith(widget);
    });
  });

  describe("data and integration", function () {
    const file = (text: string, name = "configuration.json") => new File([text], name, { type: "application/json" });
    const dataText = () => dataBlock().textContent;

    it("signals publish the population and the history table", async function () {
      const { population, history } = widget.signals;
      assert.strictEqual(widget.signals.population, population, "signal instances are stable");
      assert.equal(population.get(), store().currentActiveSimulationData.get().snapshot.agents.length);
      const table = history.get();
      assert.deepEqual(table.columns.slice(0, 4), ["tick", "population", "food_sources", "available_food_sources"]);
      assert.include(table.columns, "mean_vision_range");
      assert.equal(table.rows.length, store().simulationHistory.length);
      assert.isTrue(table.rows.every((row: unknown[]) => row.length === table.columns.length));
      const rows = table.rows.length;
      await store().runNextTick();
      assert.equal(history.get().rows.length, rows + 1);
      assert.equal(history.get().rows.at(-1)[0], store().currentActiveSimulationData.get().snapshot.tick);
    });

    it("exports the history as CSV", async function () {
      await store().runNextTick();
      const exported: File = widget.exportHistoryCsv();
      assert.equal(exported.type, "text/csv");
      assert.match(exported.name, /\.csv$/);
      const lines = (await exported.text()).trimEnd().split("\r\n");
      assert.equal(lines[0], widget.signals.history.get().columns.join(","));
      assert.equal(lines.length, store().simulationHistory.length + 1);
    });

    it("imports a configuration file only when the apply function runs", async function () {
      const before = dataText();
      const apply = await widget.importConfiguration(file(JSON.stringify(configurationFixture)));
      assert.equal(dataText(), before, "nothing changed before apply");
      apply();
      await until("new world", () => store().currentActiveSimulationData.get().metadata.worldSize.x === 20);
      assert.equal(runView().configuration.initOptions.seed.value, "imported");
      assert.isFalse(runView().configuration.graphs.showFoodAvailabilityGraph);
    });

    it("rejects invalid configuration files and leaves the widget alone", async function () {
      const before = dataText();
      const broken = JSON.parse(JSON.stringify(configurationFixture));
      broken.configuration.initOptions.mutationRate.value = 7;
      for (const text of ["not json", "[]", "{}", JSON.stringify(broken)]) {
        let message = "";
        try {
          await widget.importConfiguration(file(text));
        } catch (error: any) {
          message = error.message;
        }
        assert.isNotEmpty(message, `rejected: ${text.slice(0, 20)}`);
      }
      assert.equal(dataText(), before);
    });

    it("a configuration export imports back unchanged", async function () {
      const exported: File = widget.exportConfiguration();
      assert.equal(exported.type, "application/json");
      const original = JSON.parse(await exported.text());
      const next = JSON.parse(JSON.stringify(configurationFixture));
      (await widget.importConfiguration(file(JSON.stringify(next))))();
      await until("imported", () => runView().configuration.initOptions.seed.value === "imported");
      (await widget.importConfiguration(exported))();
      await until("restored", () => runView().configuration.initOptions.seed.value === original.configuration.initOptions.seed.value);
      assert.deepEqual(JSON.parse(await widget.exportConfiguration().text()), original);
    });
  });

  describe("language", function () {
    it("the widget's language switches the texts of nested components", async function () {
      assert.isFalse(widget.hasAttribute("lang"), "no lang yet");
      widget.setAttribute("lang", "de");
      await until("German reset button", () => buttonLabelled("Zurücksetzen"));
      assert.equal(widget.getAttribute("lang"), "de", "lang attribute stays as authored");
      assert.notEqual(widget.actions.configureSimulation.label._, "Configure simulation", "action label translated");
      widget.setAttribute("lang", "fr");
      await until("French reset button", () => buttonLabelled("Réinitialiser") || buttonLabelled("Réinitialisation") || buttonLabelled("Reset") === undefined);
      widget.setAttribute("lang", "xx-unknown");
      await until("source language fallback", () => buttonLabelled("Reset"));
    });

    it("the charts follow the language", async function () {
      widget.setAttribute("lang", "en");
      await until("English", () => buttonLabelled("Reset"));
      const view = runView();
      view.mode = "graphs";
      await view.updateComplete;
      const analysis = () => view.shadowRoot.querySelector("simulation-analysis-view");
      const wrappers = () => [...analysis().shadowRoot.querySelectorAll("chart-wrapper")] as any[];
      const byLabel = (label: string) => wrappers().find((w) => w.label === label);
      await until("charts", () => wrappers().length >= 2);
      const population = byLabel("Population development"), food = byLabel("Food availability");
      assert.equal(population.chartOptions.scales.y.title.text, "Agents");
      widget.setAttribute("lang", "de");
      await until("German axis", () => population.chartOptions.scales.y.title.text === "Agenten");
      assert.equal(food.chartData.datasets[0].label, "Verfügbare Nahrung");
      widget.removeAttribute("lang");
      await until("source again", () => population.chartOptions.scales.y.title.text === "Agents");
    });
  });
});

mocha.run();
