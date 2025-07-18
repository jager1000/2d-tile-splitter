export type TileClassification = 'floor' | 'wall' | 'decoration';
export type EnvironmentType = 'auto' | 'nature' | 'dungeon' | 'city' | 'abstract';
export interface Tile {
    id: string;
    imageData: string;
    classification: TileClassification;
    confidence: number;
    metadata: {
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
    gridConfig: AtlasGridConfig;
    tileSize: number;
}
export interface TileClassificationResult {
    tileId: string;
    classification: TileClassification;
    confidence: number;
    features: {
        dominantColor: {
            r: number;
            g: number;
            b: number;
        };
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
export interface TileAnalysisFeatures {
    dominantColor: {
        r: number;
        g: number;
        b: number;
    };
    brightness: number;
    variance: number;
    edges: number;
    hasTransparency: boolean;
    colorComplexity: number;
}
//# sourceMappingURL=index.d.ts.map