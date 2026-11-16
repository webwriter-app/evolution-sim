/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import { getMochaConfig } from "@webwriter/build/test";
import "../src/widgets/webwriter-evolution-sim";
import snippet from "../snippets/island-evolution.html";
import { dataBlockOf, deepQuery, until } from "./helpers";

mocha.setup(getMochaConfig());

describe("ancestry tab", function () {
  this.timeout(40000);
  let widget: any;
  let family: any;

  const root = () => widget.shadowRoot as ShadowRoot;
  const store = () => widget.simulationStore;
  const ancestryTab = () => deepQuery(root(), "simulation-agent-ancestry-tab") as any;
  const scene = () => ancestryTab()?.shadowRoot.querySelector("ww-scene") as HTMLElement;
  const nodes = () => [...scene().querySelectorAll("ww-node")] as HTMLElement[];
  const text = (node: Element) => node.textContent!.replace(/\s+/g, " ").trim();
  const selectionId = () => store().currentSelection.get()?.entityId ?? store().currentSelection.get()?.id;
  const press = (target: HTMLElement) => {
    const box = target.getBoundingClientRect();
    const at = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, pointerId: 1, pointerType: "mouse", button: 0, isPrimary: true, bubbles: true, composed: true };
    target.dispatchEvent(new PointerEvent("pointerdown", { ...at, buttons: 1 }));
    target.dispatchEvent(new PointerEvent("pointerup", { ...at, buttons: 0 }));
  };

  before(async function () {
    document.body.insertAdjacentHTML("beforeend", `<webwriter-evolution-sim id="sim">${dataBlockOf(snippet)}</webwriter-evolution-sim>`);
    widget = document.getElementById("sim");
    await until("simulation ready", () => store()?.simulationStatus.get() === "ready");
    const hasFamily = (snapshot: any) =>
      snapshot.agents.find((a: any) => a.parentIds?.length && snapshot.agents.some((b: any) => b.parentIds?.includes(a.id)));
    for (let i = 0; i < 2000 && !family; i++) {
      await store().runNextTick();
      family = hasFamily(store().currentActiveSimulationData.get().snapshot);
    }
    if (!family) throw new Error("no agent with a parent and a child appeared");
    store().selectEntity({ entityId: family.id, entityType: "agent" });
    const tabGroup = await until("tab group", () => deepQuery(root(), "sl-tab-group")) as any;
    tabGroup.show("ancestry");
  });

  after(function () {
    widget?.remove();
  });

  it("draws parent, agent and child as scene nodes and edges", async function () {
    const snapshot = store().currentActiveSimulationData.get().snapshot;
    const parentId = family.parentIds[0];
    const childIds: string[] = snapshot.agents.filter((a: any) => a.parentIds?.includes(family.id)).map((a: any) => a.id);
    const expected = 2 + new Set(childIds).size;
    await until("ancestry nodes", () => scene() && nodes().length === expected);
    assert.isNull(deepQuery(root(), "lit-flow"), "old flow element");
    const byKey = Object.fromEntries(nodes().map((n) => [n.dataset.wwKey!, n]));
    assert.isTrue(byKey[family.id].hasAttribute("selected"), "agent selected");
    assert.isFalse(byKey[parentId].hasAttribute("selected"), "parent not selected");
    assert.equal(text(byKey[parentId]), `Parent ${parentId.slice(0, 8)}`);
    assert.equal(text(byKey[family.id]), `Agent ${family.id.slice(0, 8)}`);
    assert.equal(text(byKey[childIds[0]]), `Child ${childIds[0].slice(0, 8)}`);
    assert.isNull(scene().querySelector("ww-shape"), "no hand-drawn arrowheads or padding shapes");
    assert.isTrue([...scene().querySelectorAll("ww-path")].every((p) => p.getAttribute("marker-end") === "arrow"), "edges end in an arrow marker");
    const paths = [...scene().querySelectorAll("ww-path")].map((p) => `${p.getAttribute("from")}>${p.getAttribute("to")}`);
    assert.include(paths, `${parentId}:out>${family.id}:in`, "edge parent to agent");
    assert.include(paths, `${family.id}:out>${childIds[0]}:in`, "edge agent to child");
    assert.isFalse(nodes().some((n) => n.hasAttribute("movable") || n.hasAttribute("resizable")), "nodes are fixed");
  });

  it("a pointer press on another agent selects it in the simulation", async function () {
    const parentId = family.parentIds[0];
    press(nodes().find((n) => n.dataset.wwKey === parentId)!);
    await until("parent selected", () => selectionId() === parentId);
    await until("tree follows", () => nodes().find((n) => n.dataset.wwKey === parentId)?.hasAttribute("selected"));
  });

  it("a press on the agent itself changes nothing", async function () {
    const selfId = selectionId();
    press(nodes().find((n) => n.hasAttribute("selected"))!);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(selectionId(), selfId);
  });

  it("the zoom buttons and the wheel change the view of the tree", async function () {
    const controls = ancestryTab().shadowRoot.querySelector("[data-ww-viewport-controls]");
    const buttons = () => [...controls.querySelectorAll("button")] as HTMLButtonElement[];
    await until("controls", () => buttons().length === 4);
    const percent = () => parseInt(buttons()[2].textContent!, 10);
    const before = percent();
    buttons()[1].click();
    await until("zoomed in", () => percent() > before);
    const zoomedIn = percent();
    buttons()[0].click();
    await until("zoomed out", () => percent() < zoomedIn);
    buttons()[1].click(); buttons()[1].click();
    await until("zoomed in again", () => percent() > zoomedIn);
    buttons()[3].click();
    await until("fitted", () => percent() === before);
    const box = scene().getBoundingClientRect();
    scene().dispatchEvent(new WheelEvent("wheel", { deltaY: -200, ctrlKey: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, bubbles: true, cancelable: true, composed: true }));
    await until("wheel zoom", () => percent() > before);
  });

  it("draws a dotted grid background", function () {
    assert.equal(scene().getAttribute("background"), "dots");
  });

  it("the plain wheel zooms the tree", async function () {
    const controls = ancestryTab().shadowRoot.querySelector("[data-ww-viewport-controls]");
    const percentOf = () => parseInt(controls.querySelectorAll("button")[2].textContent!, 10);
    (controls.querySelectorAll("button")[3] as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const before = percentOf();
    const box = scene().getBoundingClientRect();
    const wheel = (deltaY: number) => scene().dispatchEvent(new WheelEvent("wheel", { deltaY, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, bubbles: true, cancelable: true, composed: true }));
    wheel(-200);
    await until("zoomed in by wheel", () => percentOf() > before);
    wheel(400);
    await until("zoomed out by wheel", () => percentOf() < before);
  });

  it("fit leaves room around the tree", async function () {
    const controls = ancestryTab().shadowRoot.querySelector("[data-ww-viewport-controls]");
    (controls.querySelectorAll("button")[3] as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const frame = scene().getBoundingClientRect();
    const boxes = nodes().map((n) => n.getBoundingClientRect());
    assert.isAtLeast(Math.min(...boxes.map((b) => b.left)) - frame.left, 20, "left room");
    assert.isAtLeast(frame.right - Math.max(...boxes.map((b) => b.right)), 20, "right room");
  });

  it("shows an empty state without data", async function () {
    const tab = ancestryTab();
    const id = tab.agentId;
    tab.agentId = "no-such-agent";
    await tab.updateComplete;
    assert.isNull(tab.shadowRoot.querySelector("ww-scene"));
    assert.equal(tab.shadowRoot.querySelector(".empty-state").textContent.trim(), "No ancestry data available.");
    tab.agentId = id;
    await tab.updateComplete;
  });
});

mocha.run();
