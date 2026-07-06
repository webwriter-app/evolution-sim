import { Assets, Texture } from "pixi.js";

import AgentBodySprite from "./MockAgentBodySprite.png";
import AgentEyesSprite from "./MockAgentEyesSprite.png";
import BackgroundTileData from "./MockBackgroundTile.png";
import FoodSourceSpriteData from "./MockFoodSourceSprite.png";
import AgentPreviewSpriteData from "./MockAgentPreview.png";

export { AgentBodySprite, AgentPreviewSpriteData, FoodSourceSpriteData };

export const Textures = {
  backgroundTile: Texture.EMPTY,
  foodSource: Texture.EMPTY,
  agent: {
    body: Texture.EMPTY,
    eyes: Texture.EMPTY,
  },
};

let loadTexturesPromise: Promise<void> | null = null;

export function loadTextures() {
  loadTexturesPromise ??= Promise.all([
    Assets.load(BackgroundTileData),
    Assets.load(FoodSourceSpriteData),
    Assets.load(AgentBodySprite),
    Assets.load(AgentEyesSprite),
  ]).then(([backgroundTile, foodSource, agentBody, agentEyes]) => {
    Textures.backgroundTile = backgroundTile;
    Textures.foodSource = foodSource;
    Textures.agent.body = agentBody;
    Textures.agent.eyes = agentEyes;
  });

  return loadTexturesPromise;
}
