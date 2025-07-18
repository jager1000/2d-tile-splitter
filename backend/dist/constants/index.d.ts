export declare const APP_CONFIG: {
    readonly PORT: string | 5000;
    readonly NODE_ENV: string;
    readonly MAX_FILE_SIZE: number;
    readonly SUPPORTED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "image/gif"];
    readonly DEFAULT_TILE_SIZE: 32;
    readonly MAX_TILE_SIZE: 128;
    readonly MIN_TILE_SIZE: 8;
    readonly DEFAULT_MAP_SIZE: 32;
    readonly MAX_MAP_SIZE: 128;
    readonly MIN_MAP_SIZE: 8;
};
export declare const TILE_CLASSIFICATIONS: {
    readonly FLOOR: "floor";
    readonly WALL: "wall";
    readonly DECORATION: "decoration";
};
export declare const ENVIRONMENT_TYPES: {
    readonly AUTO: "auto";
    readonly NATURE: "nature";
    readonly DUNGEON: "dungeon";
    readonly CITY: "city";
    readonly ABSTRACT: "abstract";
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_FILE_TYPE: "Invalid file type. Supported formats: JPEG, PNG, WebP, GIF";
    readonly FILE_TOO_LARGE: "File too large. Maximum size is 10MB";
    readonly INVALID_GRID_CONFIG: "Invalid grid configuration";
    readonly INVALID_TILE_SIZE: "Invalid tile size. Must be between 8 and 128 pixels";
    readonly INVALID_MAP_SIZE: "Invalid map size. Must be between 8 and 128";
    readonly ATLAS_NOT_FOUND: "Atlas not found";
    readonly MAP_NOT_FOUND: "Map not found";
    readonly TILE_NOT_FOUND: "Tile not found";
    readonly EXTRACTION_FAILED: "Failed to extract tiles from image";
    readonly CLASSIFICATION_FAILED: "Failed to classify tiles";
    readonly GENERATION_FAILED: "Failed to generate map";
};
//# sourceMappingURL=index.d.ts.map