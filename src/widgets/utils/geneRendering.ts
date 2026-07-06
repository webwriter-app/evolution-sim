import { Container, Sprite, Texture } from "pixi.js";
import { SIMULATION_TILE_SIZE } from "@/simulation/rendering";
import { GeneName, getDefinedGene } from "@/simulation/genetics/definitions";
import { Gene, Genome } from "@/simulation/genetics/genome";
import { SIMULATION_ENTITY_LAYERS } from "@/simulation/entityPresentation";
import { Textures } from "../assets";

abstract class GeneRenderer<
  TGeneName extends GeneName,
  TGene extends Gene<TGeneName> = Gene<TGeneName>,
> {
  readonly root: Container;
  readonly geneSprite: Sprite;
  readonly zIndex: number;
  readonly baseScale: number;

  readonly geneName: TGeneName;

  constructor(
    zIndex: number,
    geneName: TGeneName,
    gene: TGene,
    geneTexture: Texture,
  ) {
    this.zIndex = zIndex;
    this.baseScale =
      SIMULATION_TILE_SIZE / Math.max(geneTexture.width, geneTexture.height);
    this.root = new Container({
      zIndex: SIMULATION_ENTITY_LAYERS.agent + zIndex,
    });
    this.geneSprite = new Sprite({
      texture: geneTexture,
    });
    this.geneSprite.anchor.set(0.5);
    this.geneSprite.position.set(
      SIMULATION_TILE_SIZE / 2,
      SIMULATION_TILE_SIZE / 2,
    );
    this.geneSprite.scale.set(this.baseScale);
    this.root.addChild(this.geneSprite);
    this.geneName = geneName;

    this.applyGeneToSprite(gene);
  }

  abstract applyGeneToSprite(gene: TGene): void;
}

type GeneRenderers = {
  [TGeneName in GeneName]: (gene: Gene<TGeneName>) => GeneRenderer<TGeneName>;
};

export const geneRenderers: GeneRenderers = {
  "energy-capacity": (gene) => {
    const renderer = new (class extends GeneRenderer<"energy-capacity"> {
      applyGeneToSprite(gene: Gene<"energy-capacity">): void {
        const energyCapacity = gene.allele;

        const geneDefinition = getDefinedGene(gene.geneName);
        const geneValueRatio =
          (energyCapacity - geneDefinition.min) /
          (geneDefinition.max - geneDefinition.min);

        const tintValue = Math.floor(geneValueRatio * 0xffffff);
        this.geneSprite.scale.set(this.baseScale);
        this.geneSprite.tint = tintValue;
      }
    })(0, "energy-capacity", gene, Textures.agent.body);

    return renderer;
  },

  "vision-range": (gene) => {
    const renderer = new (class extends GeneRenderer<"vision-range"> {
      applyGeneToSprite(gene: Gene<"vision-range">): void {
        const visionRange = gene.allele;

        const geneDefinition = getDefinedGene(gene.geneName);
        const geneValueRatio =
          (visionRange - geneDefinition.min) /
          (geneDefinition.max - geneDefinition.min);

        const minScale = 0.5;
        const maxScale = 1.5;
        const scale = minScale + geneValueRatio * (maxScale - minScale);

        this.geneSprite.scale.set(this.baseScale * scale);
      }
    })(1, "vision-range", gene, Textures.agent.eyes);

    return renderer;
  },
};

export class GenomeRenderer {
  readonly root: Container;

  readonly geneRenderers: Array<GeneRenderer<GeneName>>;

  constructor(genome: Genome) {
    this.root = new Container({
      sortableChildren: true,
    });
    this.geneRenderers = [];

    this.geneRenderers = genome.map((geneEntry) => {
      const geneRendererFactory = geneRenderers[geneEntry.geneName] as (
        gene: Gene<GeneName>,
      ) => GeneRenderer<GeneName>;

      const geneRenderer = geneRendererFactory(geneEntry);
      return geneRenderer;
    });

    this.geneRenderers
      .slice()
      .sort((left, right) => left.zIndex - right.zIndex)
      .forEach((renderer) => {
        this.root.addChild(renderer.root);
      });
  }
}
