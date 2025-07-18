import type { GeneratedMap, MapGenerationParams, TileAtlas } from '../types';
export declare class MapGenerationService {
    static storeAtlas(atlas: TileAtlas): void;
    static getAtlas(atlasId: string): TileAtlas | null;
    static generateMap(params: MapGenerationParams): GeneratedMap;
    private static generateMapCells;
    private static generateCell;
    private static shouldBeInteriorWall;
    private static shouldBeDecoration;
    private static createSeededRNG;
}
//# sourceMappingURL=MapGenerationService.d.ts.map