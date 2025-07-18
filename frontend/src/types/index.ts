import { TILE_CLASSIFICATIONS, STATUS_TYPES, ENVIRONMENT_TYPES } from '@/constants';

export type TileClassification = typeof TILE_CLASSIFICATIONS[keyof typeof TILE_CLASSIFICATIONS];
export type StatusType = typeof STATUS_TYPES[keyof typeof STATUS_TYPES];
export type EnvironmentType = typeof ENVIRONMENT_TYPES[number]['value'];

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
  enabledLayers: {
    floors: boolean;
    walls: boolean;
    decorations: boolean;
  };
  seed?: number;
}

export interface AtlasGridConfig {
  type: 'auto' | 'preset' | 'custom';
  cols?: number;
  rows?: number;
}

export interface TileExtractionParams {
  imageFile: File;
  gridConfig: AtlasGridConfig;
  tileSize: number;
}

export interface TileClassificationResult {
  tileId: string;
  classification: TileClassification;
  confidence: number;
  features: {
    dominantColor: { r: number; g: number; b: number };
    brightness: number;
    variance: number;
    edges: number;
  };
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StatusMessage {
  type: StatusType;
  message: string;
  duration?: number;
}

export interface PaintTool {
  selectedTileId: string | null;
  isActive: boolean;
  brushSize: number;
  mode: 'paint' | 'erase';
}
