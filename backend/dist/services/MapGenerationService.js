"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapGenerationService = void 0;
const uuid_1 = require("uuid");
const atlasStorage = {};
class MapGenerationService {
    static storeAtlas(atlas) {
        atlasStorage[atlas.id] = atlas;
    }
    static getAtlas(atlasId) {
        return atlasStorage[atlasId] || null;
    }
    static generateMap(params) {
        const atlas = this.getAtlas(params.atlasId);
        if (!atlas) {
            throw new Error(`Atlas not found: ${params.atlasId}`);
        }
        const cells = this.generateMapCells(params, atlas);
        const map = {
            id: (0, uuid_1.v4)(),
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
    static generateMapCells(params, atlas) {
        const floorTiles = atlas.tiles.filter(tile => tile.classification === 'floor');
        const wallTiles = atlas.tiles.filter(tile => tile.classification === 'wall');
        const decorationTiles = atlas.tiles.filter(tile => tile.classification === 'decoration');
        const availableFloorTiles = floorTiles.length > 0 ? floorTiles : atlas.tiles;
        const availableWallTiles = wallTiles.length > 0 ? wallTiles : atlas.tiles;
        const availableDecorationTiles = decorationTiles.length > 0 ? decorationTiles : atlas.tiles;
        const cells = [];
        for (let y = 0; y < params.height; y++) {
            const row = [];
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
    static generateCell(x, y, params, tileSets) {
        const { width, height, environmentType, enabledLayers, seed } = params;
        const rng = this.createSeededRNG(seed || 42, x, y);
        const isPerimeter = x === 0 || x === width - 1 || y === 0 || y === height - 1;
        const isInteriorWall = this.shouldBeInteriorWall(x, y, width, height, environmentType, rng);
        let layer = 'floor';
        let tileSet = tileSets.floor;
        if (enabledLayers.walls && (isPerimeter || isInteriorWall)) {
            layer = 'wall';
            tileSet = tileSets.wall;
        }
        else if (enabledLayers.decorations && this.shouldBeDecoration(x, y, environmentType, rng)) {
            layer = 'decoration';
            tileSet = tileSets.decoration;
        }
        else if (!enabledLayers.floors) {
            return {
                x,
                y,
                tileId: null,
                layer: 'floor',
            };
        }
        const selectedTile = tileSet[Math.floor(rng() * tileSet.length)];
        return {
            x,
            y,
            tileId: selectedTile?.id || null,
            layer,
        };
    }
    static shouldBeInteriorWall(x, y, width, height, environmentType, rng) {
        switch (environmentType) {
            case 'dungeon':
                return (x % 4 === 0 || y % 4 === 0) && rng() > 0.7;
            case 'city':
                return ((x % 8 === 0 && y % 8 === 0) ||
                    (x % 6 === 3 && y % 6 === 3)) && rng() > 0.5;
            case 'nature':
                return rng() > 0.9;
            default:
                return rng() > 0.85;
        }
    }
    static shouldBeDecoration(x, y, environmentType, rng) {
        switch (environmentType) {
            case 'nature':
                return rng() > 0.8;
            case 'city':
                return rng() > 0.9;
            case 'dungeon':
                return rng() > 0.95;
            default:
                return rng() > 0.85;
        }
    }
    static createSeededRNG(seed, x, y) {
        let s = seed + x * 12345 + y * 67890;
        return () => {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    }
}
exports.MapGenerationService = MapGenerationService;
//# sourceMappingURL=MapGenerationService.js.map