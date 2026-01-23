/**
 * Custom sprites mapping for NOCRACY map
 * Individual sprite files with their dimensions
 */

export interface SpriteInfo {
  filename: string;
  width: number;
  height: number;
  type: 'terrain' | 'object' | 'building' | 'decoration';
  category: string;
}

/**
 * Mapping of sprite keys to their file information
 * Based on the provided sprite images
 */
export const CUSTOM_SPRITES: Record<string, SpriteInfo> = {
  // Terrain tiles
  grass: {
    filename: '_______-0da8e8f7-ce0d-49e0-ad20-350fd10d7437.png',
    width: 16,
    height: 16,
    type: 'terrain',
    category: 'grass',
  },
  grass_edge: {
    filename: '_____-30caa90c-a1e7-46fe-9827-95796153ba48.png',
    width: 16,
    height: 16,
    type: 'terrain',
    category: 'grass',
  },
  dirt_grass: {
    filename: '_____2-75f6de98-77b1-4ac1-bad7-9098cf7be2b0.png',
    width: 16,
    height: 16,
    type: 'terrain',
    category: 'dirt',
  },
  sand: {
    filename: '____-96a6efde-29a5-4bec-8144-f9a2509af671.png',
    width: 16,
    height: 16,
    type: 'terrain',
    category: 'sand',
  },
  water: {
    filename: '____-94c426ee-f35b-4eed-91a1-78f08b1ab4d3.png',
    width: 16,
    height: 16,
    type: 'terrain',
    category: 'water',
  },
  
  // Objects and decorations
  bush_small: {
    filename: '____-28618510-e8c0-49c0-802e-de9a6e46f269.png',
    width: 16,
    height: 16,
    type: 'decoration',
    category: 'vegetation',
  },
  bush_large: {
    filename: '_______-18791a9e-de19-4962-9e0a-8e5b0860421f.png',
    width: 15,
    height: 22,
    type: 'decoration',
    category: 'vegetation',
  },
  tree_cluster: {
    filename: '____________-651c92e7-7157-476e-b986-d3fa23d232a6.png',
    width: 15,
    height: 22,
    type: 'object',
    category: 'vegetation',
  },
  rocks: {
    filename: '______-9c4baf5d-e77f-414f-aab2-059ae1847015.png',
    width: 16,
    height: 16,
    type: 'object',
    category: 'rocks',
  },
  
  // Buildings
  house_brown: {
    filename: '___-c5820bec-829e-4642-bb8b-e8733bf3d78b.png',
    width: 16,
    height: 16,
    type: 'building',
    category: 'house',
  },
  // Note: house_white uses the same file as bush_small, need to check actual file
  // house_white: {
  //   filename: '____-28618510-e8c0-49c0-802e-de9a6e46f269.png',
  //   width: 16,
  //   height: 16,
  //   type: 'building',
  //   category: 'house',
  // },
};

/**
 * Get sprite path
 */
export function getSpritePath(key: string): string {
  const sprite = CUSTOM_SPRITES[key];
  if (!sprite) return '';
  return `/tilesets/custom/${sprite.filename}`;
}

/**
 * Get all sprite keys by category
 */
export function getSpritesByCategory(category: string): string[] {
  return Object.keys(CUSTOM_SPRITES).filter(
    key => CUSTOM_SPRITES[key].category === category
  );
}

/**
 * Get all sprite keys by type
 */
export function getSpritesByType(type: SpriteInfo['type']): string[] {
  return Object.keys(CUSTOM_SPRITES).filter(
    key => CUSTOM_SPRITES[key].type === type
  );
}
