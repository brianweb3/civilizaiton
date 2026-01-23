import { Texture, Rectangle } from "pixi.js";

/**
 * Slices a texture from a base texture at the specified coordinates.
 * @param baseTexture - The base texture (spritesheet)
 * @param x - X coordinate in pixels
 * @param y - Y coordinate in pixels
 * @param w - Width in pixels (default: 16)
 * @param h - Height in pixels (default: 16)
 * @returns A new Texture for the sliced region
 */
export function sliceTexture(
  baseTexture: Texture,
  x: number,
  y: number,
  w: number = 16,
  h: number = 16
): Texture {
  const frame = new Rectangle(x, y, w, h);
  // In v8, Texture constructor takes an options object
  return new Texture({
    source: baseTexture.source,
    frame: frame,
  });
}
