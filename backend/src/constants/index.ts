export const APP_CONFIG = {
  PORT: 8888,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DEFAULT_TILE_SIZE: 32,
  MAX_TILE_SIZE: 128,
  MIN_TILE_SIZE: 8,
  DEFAULT_MAP_SIZE: 32,
  MAX_MAP_SIZE: 128,
  MIN_MAP_SIZE: 8,
} as const;

export const TILE_CLASSIFICATIONS = {
  FLOOR: 'floor',
  WALL: 'wall',
  DECORATION: 'decoration',
} as const;

export const ENVIRONMENT_TYPES = {
  AUTO: 'auto',
  NATURE: 'nature',
  DUNGEON: 'dungeon',
  CITY: 'city',
  ABSTRACT: 'abstract',
} as const;

export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF',
  FILE_TOO_LARGE: 'File too large. Maximum size is 10MB',
  INVALID_GRID_CONFIG: 'Invalid grid configuration',
  INVALID_TILE_SIZE: 'Invalid tile size. Must be between 8 and 128 pixels',
  INVALID_MAP_SIZE: 'Invalid map size. Must be between 8 and 128',
  ATLAS_NOT_FOUND: 'Atlas not found',
  MAP_NOT_FOUND: 'Map not found',
  TILE_NOT_FOUND: 'Tile not found',
  EXTRACTION_FAILED: 'Failed to extract tiles from image',
  CLASSIFICATION_FAILED: 'Failed to classify tiles',
  GENERATION_FAILED: 'Failed to generate map',
} as const;
