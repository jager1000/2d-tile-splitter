import { v4 as uuidv4 } from 'uuid';
import type {
  GeneratedMap,
  MapGenerationParams,
  MapCell,
  TileAtlas,
  Tile,
} from '../types';

interface AtlasStorage {
  [atlasId: string]: TileAtlas;
}

// Simple in-memory storage for atlases
// In a real implementation, this would be a database
const atlasStorage: AtlasStorage = {};

export class MapGenerationService {
  /**
   * Store an atlas for later use in map generation
   */
  static storeAtlas(atlas: TileAtlas): void {
    atlasStorage[atlas.id] = atlas;
  }

  /**
   * Get a stored atlas
   */
  static getAtlas(atlasId: string): TileAtlas | null {
    return atlasStorage[atlasId] || null;
  }

  /**
   * Generate a map using tiles from the specified atlas
   */
  static generateMap(params: MapGenerationParams): GeneratedMap {
    const atlas = this.getAtlas(params.atlasId);
    if (!atlas) {
      throw new Error(`Atlas not found: ${params.atlasId}`);
    }

    // Generate the map cells
    const cells = this.generateMapCells(params, atlas);

    const map: GeneratedMap = {
      id: uuidv4(),
      name: `Generated Map ${new Date().toLocaleTimeString()}`,
      width: params.width,
      height: params.height,
      tileSize: params.tileSize,
      cells,
      environmentType: params.environmentType,
      atlasId: params.atlasId,
      createdAt: new Date(),
    };

    return map;
  }

  /**
   * Generate map cells based on parameters and available tiles
   */
  private static generateMapCells(params: MapGenerationParams, atlas: TileAtlas): MapCell[][] {
    // Categorize tiles by classification
    const floorTiles = atlas.tiles.filter(tile => tile.classification === 'floor');
    const wallTiles = atlas.tiles.filter(tile => tile.classification === 'wall');
    const decorationTiles = atlas.tiles.filter(tile => tile.classification === 'decoration');

    // If no tiles of specific type, use any tile as fallback
    const availableFloorTiles = floorTiles.length > 0 ? floorTiles : atlas.tiles;
    const availableWallTiles = wallTiles.length > 0 ? wallTiles : atlas.tiles;
    const availableDecorationTiles = decorationTiles.length > 0 ? decorationTiles : atlas.tiles;

    const cells: MapCell[][] = [];

    for (let y = 0; y < params.height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < params.width; x++) {
        const cell = this.generateCell(x, y, params, {
          floor: availableFloorTiles,
          wall: availableWallTiles,
          decoration: availableDecorationTiles,
        });
        row.push(cell);
      }
      cells.push(row);
    }

    return cells;
  }

  /**
   * Generate a single map cell
   */
  private static generateCell(
    x: number,
    y: number,
    params: MapGenerationParams,
    tileSets: {
      floor: Tile[];
      wall: Tile[];
      decoration: Tile[];
    }
  ): MapCell {
    const { width, height, environmentType, enabledLayers, seed } = params;
    
    // Use seed for reproducible generation
    const rng = this.createSeededRNG(seed || 42, x, y);

    // Determine if this should be a wall (perimeter or interior walls)
    const isPerimeter = x === 0 || x === width - 1 || y === 0 || y === height - 1;
    const isInteriorWall = this.shouldBeInteriorWall(x, y, width, height, environmentType, rng);

    let layer: 'floor' | 'wall' | 'decoration' = 'floor';
    let tileSet = tileSets.floor;

    if (enabledLayers.walls && (isPerimeter || isInteriorWall)) {
      layer = 'wall';
      tileSet = tileSets.wall;
    } else if (enabledLayers.decorations && this.shouldBeDecoration(x, y, environmentType, rng)) {
      layer = 'decoration';
      tileSet = tileSets.decoration;
    } else if (!enabledLayers.floors) {
      // If floors are disabled, use null tile
      return {
        x,
        y,
        tileId: null,
        layer: 'floor',
      };
    }

    // Select a random tile from the appropriate set
    const selectedTile = tileSet[Math.floor(rng() * tileSet.length)];

    return {
      x,
      y,
      tileId: selectedTile?.id || null,
      layer,
    };
  }

  /**
   * Determine if a position should be an interior wall
   */
  private static shouldBeInteriorWall(
    x: number,
    y: number,
    width: number,
    height: number,
    environmentType: string,
    rng: () => number
  ): boolean {
    // Different wall generation strategies based on environment
    switch (environmentType) {
      case 'dungeon':
        // Generate maze-like walls
        return (x % 4 === 0 || y % 4 === 0) && rng() > 0.7;
      
      case 'city':
        // Generate building-like structures
        return ((x % 8 === 0 && y % 8 === 0) || 
                (x % 6 === 3 && y % 6 === 3)) && rng() > 0.5;
      
      case 'nature':
        // Sparse natural obstacles
        return rng() > 0.9;
      
      default:
        // Random walls
        return rng() > 0.85;
    }
  }

  /**
   * Determine if a position should be a decoration
   */
  private static shouldBeDecoration(
    x: number,
    y: number,
    environmentType: string,
    rng: () => number
  ): boolean {
    // Different decoration density based on environment
    switch (environmentType) {
      case 'nature':
        return rng() > 0.8; // More decorations in nature
      
      case 'city':
        return rng() > 0.9; // Fewer decorations in cities
      
      case 'dungeon':
        return rng() > 0.95; // Very few decorations in dungeons
      
      default:
        return rng() > 0.85;
    }
  }

  /**
   * Create a seeded random number generator
   */
  private static createSeededRNG(seed: number, x: number, y: number): () => number {
    // Combine seed with position for deterministic randomness
    let s = seed + x * 12345 + y * 67890;
    
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }
}
