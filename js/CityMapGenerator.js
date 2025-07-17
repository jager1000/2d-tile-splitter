// City environment generator
class CityMapGenerator extends BaseMapGenerator {
    static generatePattern(map, tilesByType) {
        const height = map.length;
        const width = map[0].length;
        
        // Base with road/ground material
        this.fillWithTiles(map, tilesByType.floor || []);
        
        // Create a grid of roads
        this.generateRoadGrid(map, tilesByType.wall || []);
        
        // Add buildings/decorations
        this.generateBuildings(map, tilesByType.decoration || []);
        
        return map;
    }

    static generateRoadGrid(map, walls) {
        if (walls.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        this.generateVerticalRoads(map, walls, height, width);
        this.generateHorizontalRoads(map, walls, height, width);
    }

    static generateVerticalRoads(map, walls, height, width) {
        // Vertical roads
        for (let x = 8; x < width; x += 12) {
            for (let y = 0; y < height; y++) {
                map[y][x] = this.getRandomTile(walls);
                if (x + 1 < width) {
                    map[y][x + 1] = this.getRandomTile(walls);
                }
            }
        }
    }

    static generateHorizontalRoads(map, walls, height, width) {
        // Horizontal roads
        for (let y = 8; y < height; y += 12) {
            for (let x = 0; x < width; x++) {
                map[y][x] = this.getRandomTile(walls);
                if (y + 1 < height) {
                    map[y + 1][x] = this.getRandomTile(walls);
                }
            }
        }
    }

    static generateBuildings(map, decorations) {
        if (decorations.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        // Fill blocks with buildings
        for (let blockY = 0; blockY < height; blockY += 12) {
            for (let blockX = 0; blockX < width; blockX += 12) {
                if (Math.random() > 0.3) { // 70% chance of building
                    this.generateBuilding(map, decorations, blockX, blockY);
                }
            }
        }
    }

    static generateBuilding(map, decorations, blockX, blockY) {
        const height = map.length;
        const width = map[0].length;
        
        for (let y = blockY + 1; y < Math.min(blockY + 7, height); y++) {
            for (let x = blockX + 1; x < Math.min(blockX + 7, width); x++) {
                if (Math.random() > 0.2) {
                    map[y][x] = this.getRandomTile(decorations);
                }
            }
        }
    }
}

// Top-down/abstract environment generator
class TopDownMapGenerator extends BaseMapGenerator {
    static generatePattern(map, tilesByType) {
        const height = map.length;
        const width = map[0].length;
        
        // Fill with floor tiles
        this.fillWithTiles(map, tilesByType.floor || []);
        
        // Add walls around edges
        this.generateBorders(map, tilesByType.wall || []);
        
        // Add decorations
        this.generateRandomDecorations(map, tilesByType.decoration || []);
        
        return map;
    }

    static generateBorders(map, walls) {
        if (walls.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        // Top and bottom borders
        for (let x = 0; x < width; x++) {
            map[0][x] = this.getRandomTile(walls);
            map[height - 1][x] = this.getRandomTile(walls);
        }
        
        // Left and right borders
        for (let y = 0; y < height; y++) {
            map[y][0] = this.getRandomTile(walls);
            map[y][width - 1] = this.getRandomTile(walls);
        }
    }

    static generateRandomDecorations(map, decorations) {
        if (decorations.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        const numDecorations = Math.floor((width * height) * 0.1);
        
        for (let i = 0; i < numDecorations; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            map[y][x] = this.getRandomTile(decorations);
        }
    }
}

// Export for use in other modules
window.CityMapGenerator = CityMapGenerator;
window.TopDownMapGenerator = TopDownMapGenerator;
