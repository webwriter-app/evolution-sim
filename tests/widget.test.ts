/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import "../src/widgets/webwriter-evolution-sim";
import snippet from "../snippets/island-evolution.html";
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
