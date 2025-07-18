import type { TileAtlas, AtlasGridConfig } from '../types';
export declare class TileExtractionService {
    static extractTiles(imageBuffer: Buffer, gridConfig: AtlasGridConfig, tileSize: number, originalFilename: string): Promise<TileAtlas>;
    private static calculateGrid;
    private static detectOptimalGrid;
    private static extractTilesFromGrid;
    private static isMeaningfulTile;
    private static analyzeTileFeatures;
    private static classifyTileByFeatures;
    private static classifyByColor;
    private static calculateClassificationConfidence;
}
//# sourceMappingURL=TileExtractionService.d.ts.map