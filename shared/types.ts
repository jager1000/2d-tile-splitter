// Shared types for both frontend and backend
export type TileClassification = 'floor' | 'wall' | 'decoration';
export type EnvironmentType = 'auto' | 'nature' | 'dungeon' | 'city' | 'abstract';
export type StatusType = 'success' | 'error' | 'warning' | 'info';

export interface Tile {
  id: string;
  imageData: string; // Base64 data URL
  classification: TileClassification;
  confidence?: number;
  metadata?: {
    sourceX: number;
    sourceY: number;
    width: number;
    height: number;
  };
}

export interface TileAtlas {
  id: string;
  name: string;
  imageData: string;
  originalImage: {
    width: number;
    height: number;
  };
  grid: {
    cols: number;
    rows: number;
    tileWidth: number;
    tileHeight: number;
  };
  tiles: Tile[];
  createdAt: Date;
}

export interface MapCell {
  x: number;
  y: number;
  tileId: string | null;
  layer: 'floor' | 'wall' | 'decoration';
}

export interface GeneratedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  cells: MapCell[][];
  environmentType: EnvironmentType;
  atlasId: string;
  createdAt: Date;
}

export interface MapGenerationParams {
  width: number;
  height: number;
  tileSize: number;
  environmentType: EnvironmentType;
  atlasId: string;
  tilesByType: Record<TileClassification, string[]>;
  seed?: number;
}

export interface GridConfig {
  type: 'auto' | 'preset' | 'custom';
  cols?: number;
  rows?: number;
}

export interface TileExtractionParams {
  imageFile: File;
  gridConfig: GridConfig;
  tileSize: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
