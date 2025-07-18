// Shared constants for both frontend and backend
export const APP_CONFIG = {
  API_BASE_URL: process.env.NODE_ENV === 'production' ? 'http://localhost:8889' : '/api',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DEFAULT_TILE_SIZE: 32,
  MAX_TILE_SIZE: 128,
  MIN_TILE_SIZE: 8,
  DEFAULT_MAP_SIZE: 32,
  MAX_MAP_SIZE: 128,
  MIN_MAP_SIZE: 8,
} as const;

export const GRID_PRESETS = [
  { label: 'Auto-detect', value: 'auto' },
  { label: '2×2', value: '2x2', cols: 2, rows: 2 },
  { label: '4×4', value: '4x4', cols: 4, rows: 4 },
  { label: '8×8', value: '8x8', cols: 8, rows: 8 },
  { label: '16×16', value: '16x16', cols: 16, rows: 16 },
  { label: '32×32', value: '32x32', cols: 32, rows: 32 },
  { label: 'Custom', value: 'custom' },
] as const;

export const MAP_SIZE_PRESETS = [
  { label: '16×16', value: 16 },
  { label: '32×32', value: 32 },
  { label: '64×64', value: 64 },
  { label: '128×128', value: 128 },
] as const;

export const ENVIRONMENT_TYPES = [
  { label: 'Auto-detect', value: 'auto' },
  { label: 'Nature', value: 'nature' },
  { label: 'Dungeon', value: 'dungeon' },
  { label: 'City', value: 'city' },
  { label: 'Abstract', value: 'abstract' },
] as const;

export const TILE_CLASSIFICATIONS = {
  FLOOR: 'floor',
  WALL: 'wall',
  DECORATION: 'decoration',
} as const;

export const STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Validation helpers
export const isValidTileSize = (size: number): boolean => {
  return size >= APP_CONFIG.MIN_TILE_SIZE && size <= APP_CONFIG.MAX_TILE_SIZE;
};

export const isValidMapSize = (size: number): boolean => {
  return size >= APP_CONFIG.MIN_MAP_SIZE && size <= APP_CONFIG.MAX_MAP_SIZE;
};

export const isValidImageType = (type: string): boolean => {
  return APP_CONFIG.SUPPORTED_IMAGE_TYPES.includes(type as any);
};
