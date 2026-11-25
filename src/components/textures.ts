import { Assets, Texture } from "pixi.js";

import AgentBodySprite from "../assets/mock-agent-body-sprite.png";
import AgentEyesSprite from "../assets/mock-agent-eyes-sprite.png";
import BackgroundTileData from "../assets/mock-background-tile.png";
import FoodSourceSpriteData from "../assets/mock-food-source-sprite.png";
import AgentPreviewSpriteData from "../assets/mock-agent-preview.png";

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
