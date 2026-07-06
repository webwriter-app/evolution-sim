import { html, css } from "lit";
import { LitElementWw } from "@webwriter/lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { Application, Container, Sprite, TilingSprite } from "pixi.js";
import {
  AgentSnapshot,
  EntitySnapshot,
  FoodSourceSnapshot,
  SimulationSnapshot,
} from "@/simulation/serialization";
import { hasNoValue, hasValue } from "@/utils/typeGuards";
import { loadTextures, Textures } from "./assets";
import { SimulationMetadata } from "@/simulation/running";
import { scaleVector, Vec2 } from "@/simulation/position";
import { SIMULATION_TILE_SIZE } from "@/simulation/rendering";
import { SIMULATION_ENTITY_LAYERS } from "@/simulation/entityPresentation";
import { useSimulationStore } from "@/composables/simulationStore";
import { SignalWatcher } from "@lit-labs/signals";
import { effect } from "signal-utils/subtle/microtask-effect";
import { GenomeRenderer } from "./utils/geneRendering";

/* Optional LOCALIZATION: Uncomment this after first running `npm run localize` in the command line.
import LOCALIZE from '../localization/generated'
import {msg} from '@lit/localize'
*/

function toTilePosition(vec: Vec2): Vec2 {
  return scaleVector(vec, SIMULATION_TILE_SIZE);
}
interface EntitySnapshotRenderer<TSnapshot> {
  root: Container;
  update: (snapshot: TSnapshot) => void;
}

class BackgroundRenderer {
  readonly root: Container;
  readonly backgroundTilesSprite: TilingSprite;

  constructor() {
    this.backgroundTilesSprite = new TilingSprite({
      texture: Textures.backgroundTile,
    });

    this.root = new Container();

    this.root.addChild(this.backgroundTilesSprite);
  }

  update(worldSize: Vec2) {
    this.backgroundTilesSprite.texture = Textures.backgroundTile;
    this.backgroundTilesSprite.tileScale = {
      x: SIMULATION_TILE_SIZE / Textures.backgroundTile.width,
      y: SIMULATION_TILE_SIZE / Textures.backgroundTile.height,
    };

    const backgroundTileSize = {
      width: SIMULATION_TILE_SIZE * worldSize.x,
      height: SIMULATION_TILE_SIZE * worldSize.y,
    };

    this.backgroundTilesSprite.setSize(backgroundTileSize);
  }
}

class AgentRenderer implements EntitySnapshotRenderer<AgentSnapshot> {
  readonly root: Container;
  genomeRenderer?: GenomeRenderer;

  constructor() {
    this.root = new Container({
      zIndex: SIMULATION_ENTITY_LAYERS.agent,
    });
  }

  update(agentSnapshot: AgentSnapshot) {
    if (hasNoValue(this.genomeRenderer)) {
      this.genomeRenderer = new GenomeRenderer(agentSnapshot.genome);
      this.root.addChild(this.genomeRenderer.root);
    }

    const tilePosition = toTilePosition(agentSnapshot.state.position);

    this.root.x = tilePosition.x;
    this.root.y = tilePosition.y;
  }
}

class FoodSourceRenderer implements EntitySnapshotRenderer<FoodSourceSnapshot> {
  readonly root: Container;
  readonly bodySprite: Sprite;

  constructor() {
    this.root = new Container({
      zIndex: SIMULATION_ENTITY_LAYERS["food-source"],
    });
    this.bodySprite = new Sprite({
      texture: Textures.foodSource,
      width: SIMULATION_TILE_SIZE,
      height: SIMULATION_TILE_SIZE,
    });
    this.root.addChild(this.bodySprite);
  }

  update(foodSourceSnapshot: FoodSourceSnapshot) {
    const tilePosition = toTilePosition(foodSourceSnapshot.position);
    const isDepleted = foodSourceSnapshot.ticksTillRecovery > 0;

    this.bodySprite.alpha = isDepleted ? 0.5 : 1;

    this.bodySprite.x = tilePosition.x;
    this.bodySprite.y = tilePosition.y;
  }
}

class EntitySnapshotRendererCache<TSnapshot extends EntitySnapshot> {
  readonly rendererCache = new Map<string, EntitySnapshotRenderer<TSnapshot>>();

  constructor(
    private readonly rootContainer: Container,
    private readonly createRenderer: () => EntitySnapshotRenderer<TSnapshot>,
  ) {}

  update(snapshots: TSnapshot[]) {
    const oldIds = Array.from(this.rendererCache.keys());
    const nextIds = new Set(snapshots.map((sp) => sp.id));

    const removedIds = oldIds.filter((id) => !nextIds.has(id));
    const renderersToRemove = removedIds
      .map((id) => this.rendererCache.get(id))
      .filter(hasValue);

    removedIds.forEach((removedId) => this.rendererCache.delete(removedId));

    // Remove
    for (const removedRenderer of renderersToRemove) {
      this.rootContainer.removeChild(removedRenderer.root);
    }

    for (const snapshot of snapshots) {
      const snapshotId = snapshot.id;
      const cachedRenderer = this.rendererCache.get(snapshotId);
      // Update
      if (hasValue(cachedRenderer)) {
        cachedRenderer.update(snapshot);
      }
      // Create
      else {
        const newRenderer = this.createRenderer();
        newRenderer.update(snapshot);
        this.rendererCache.set(snapshotId, newRenderer);
        this.rootContainer.addChild(newRenderer.root);
      }
    }
  }
}

function useSimulationRenderer() {
  const rootContainer = new Container({
    sortableChildren: true,
  });
  const backgroundRenderer = new BackgroundRenderer();
  const agentRendererCache = new EntitySnapshotRendererCache(
    rootContainer,
    () => new AgentRenderer(),
  );
  const foodSourceRendererCache = new EntitySnapshotRendererCache(
    rootContainer,
    () => new FoodSourceRenderer(),
  );

  rootContainer.addChild(backgroundRenderer.root);

  function update(
    metadata: SimulationMetadata,
    snapshot: SimulationSnapshot | null,
  ) {
    backgroundRenderer.update(metadata.worldSize);

    agentRendererCache.update(snapshot?.agents ?? []);
    foodSourceRendererCache.update(snapshot?.foodSources ?? []);
  }

  return {
    root: rootContainer,
    update,
  };
}

@customElement("simulation-state-render")
export class SimulationStateRender extends SignalWatcher(LitElementWw) {
  /* Optional LOCALIZATION: Uncomment this after first running `npm run localize` in the command line.
  localize = LOCALIZE
  */

  simulationStore = useSimulationStore();

  @query("#simulation-container")
  accessor canvasContainer!: HTMLDivElement;

  @property({ attribute: "widget-id" })
  accessor widgetId = "";

  app: Application | null = null;
  renderer = useSimulationRenderer();
  unwatch: (() => void) | null = null;
  private currentWorldSize: Vec2 | null = null;

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.simulationStore.setActiveManualTool(null);
    }
  };

  private getTilePositionFromClientPoint(
    clientX: number,
    clientY: number,
  ): Vec2 | null {
    if (!hasValue(this.app)) {
      return null;
    }

    const bounds = this.canvasContainer.getBoundingClientRect();
    const localX = clientX - bounds.left;
    const localY = clientY - bounds.top;
    const scaleX = this.app.screen.width / bounds.width;
    const scaleY = this.app.screen.height / bounds.height;

    const worldX =
      (localX * scaleX - this.renderer.root.position.x) /
      this.renderer.root.scale.x;
    const worldY =
      (localY * scaleY - this.renderer.root.position.y) /
      this.renderer.root.scale.y;
    const tilePosition = {
      x: Math.floor(worldX / SIMULATION_TILE_SIZE),
      y: Math.floor(worldY / SIMULATION_TILE_SIZE),
    };

    if (
      !hasValue(this.currentWorldSize) ||
      tilePosition.x < 0 ||
      tilePosition.y < 0 ||
      tilePosition.x >= this.currentWorldSize.x ||
      tilePosition.y >= this.currentWorldSize.y
    ) {
      return null;
    }

    return tilePosition;
  }

  private getTilePositionFromEvent(event: DragEvent): Vec2 | null {
    return this.getTilePositionFromClientPoint(event.clientX, event.clientY);
  }

  private getDraggedManualTool() {
    const dragState = this.simulationStore.manualToolDnd.getDraggedItem();

    if (dragState?.originId === this.widgetId) {
      return dragState.item;
    } else {
      return null;
    }
  }

  private handleDragOver(event: DragEvent) {
    if (hasValue(this.getDraggedManualTool())) {
      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }
  }

  private handleDrop(event: DragEvent) {
    const tool = this.getDraggedManualTool();
    const tilePosition = this.getTilePositionFromEvent(event);

    if (!hasValue(tool) || !hasValue(tilePosition)) {
      return;
    }

    event.preventDefault();

    if (tool === "add-food-source") {
      this.simulationStore.addFoodSource(tilePosition);
    } else if (tool === "add-agent") {
      this.simulationStore.addAgent(tilePosition);
    } else {
      this.simulationStore.manualToolDnd.endDrag();
    }
  }

  private handleClick(event: MouseEvent) {
    const tilePosition = this.getTilePositionFromClientPoint(
      event.clientX,
      event.clientY,
    );
    if (hasNoValue(tilePosition)) return;

    const activeManualTool = this.simulationStore.activeManualTool.get();

    if (activeManualTool === "remove-entity") {
      this.simulationStore.removeEntityAt(tilePosition);
    } else {
      this.simulationStore.selectEntityAt(tilePosition);
    }
  }

  private fitSimulationToCanvas() {
    if (!hasValue(this.app) || !hasValue(this.currentWorldSize)) {
      return;
    }

    const worldPixelWidth = this.currentWorldSize.x * SIMULATION_TILE_SIZE;
    const worldPixelHeight = this.currentWorldSize.y * SIMULATION_TILE_SIZE;

    if (worldPixelWidth <= 0 || worldPixelHeight <= 0) {
      return;
    }

    const scale = Math.min(
      this.app.screen.width / worldPixelWidth,
      this.app.screen.height / worldPixelHeight,
    );

    this.renderer.root.scale.set(scale);
    this.renderer.root.position.set(
      (this.app.screen.width - worldPixelWidth * scale) / 2,
      (this.app.screen.height - worldPixelHeight * scale) / 2,
    );
  }

  private async setupCanvas() {
    await loadTextures();

    const app = new Application();

    await app.init({ resizeTo: this.canvasContainer, background: "#FFFFFF" });
    this.canvasContainer.appendChild(app.canvas);

    this.app = app;
    app.stage.addChild(this.renderer.root);
  }

  /** Register the classes of custom elements to use in the Shadow DOM here.
   * @example
   * import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
   * ...
   *   static scopedElements = {"sl-button": SlButton}
   **/
  static scopedElements = {};

  /** Put the styles for your Shadow DOM (what is rendered through render()) here. */
  static styles = css`
    #simulation-container {
      width: 100%;
      aspect-ratio: 16 / 9;
      line-height: 0;
      overflow: hidden;
    }

    #simulation-container canvas {
      display: block;
    }

    #simulation-container.delete-mode {
      cursor: crosshair;
      outline: 2px solid var(--sl-color-danger-500);
      outline-offset: 2px;
    }
  `;

  /** Define your template here and return it. */
  render() {
    const isDeleteMode =
      this.simulationStore.activeManualTool.get() === "remove-entity";
    const worldSize =
      this.simulationStore.currentActiveSimulationData.get()?.metadata
        .worldSize;
    const aspectRatio =
      hasValue(worldSize) && worldSize.x > 0 && worldSize.y > 0
        ? `${worldSize.x} / ${worldSize.y}`
        : "16 / 9";

    return html`
      <div
        id="simulation-container"
        class=${classMap({ "delete-mode": isDeleteMode })}
        style=${styleMap({
          "aspect-ratio": aspectRatio,
        })}
        @dragover=${this.handleDragOver}
        @drop=${this.handleDrop}
        @click=${this.handleClick}
      ></div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    window.addEventListener("keydown", this.handleKeyDown);
  }

  async firstUpdated() {
    await this.setupCanvas();

    this.unwatch = effect(() => {
      const data = this.simulationStore.currentActiveSimulationData.get();

      if (hasValue(data)) {
        const previousWorldSize = this.currentWorldSize;
        this.currentWorldSize = data.metadata.worldSize;
        this.renderer.update(data.metadata, data.snapshot);

        if (
          !hasValue(previousWorldSize) ||
          previousWorldSize.x !== data.metadata.worldSize.x ||
          previousWorldSize.y !== data.metadata.worldSize.y
        ) {
          this.updateComplete.then(() => {
            this.app?.resize();
            this.fitSimulationToCanvas();
          });
        }
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.app?.destroy();
    this.unwatch?.();
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}
