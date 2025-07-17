// Abstract base class for map generators
class BaseMapGenerator {
    static generate(width, height, tilesByType) {
        const map = Array(height).fill(null).map(() => Array(width).fill(null));
        return this.generatePattern(map, tilesByType);
    }

    static generatePattern(map, tilesByType) {
        throw new Error('generatePattern must be implemented by subclass');
    }

    static fillWithTiles(map, tiles, startX = 0, startY = 0, endX = null, endY = null) {
        if (tiles.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        endX = endX || width;
        endY = endY || height;
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    map[y][x] = tiles[Math.floor(Math.random() * tiles.length)];
                }
            }
        }
    }

    static placeTileAt(map, tiles, x, y) {
        if (tiles.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
            map[y][x] = tiles[Math.floor(Math.random() * tiles.length)];
        }
    }

    static getRandomTile(tiles) {
        return tiles.length > 0 ? tiles[Math.floor(Math.random() * tiles.length)] : null;
    }
}

// Nature environment generator
class NatureMapGenerator extends BaseMapGenerator {
    static generatePattern(map, tilesByType) {
        const height = map.length;
        const width = map[0].length;
        
        // Base layer: mostly grass/ground
        this.fillWithTiles(map, tilesByType.floor || []);
        
        // Water features (walls can be water)
        this.generateWaterFeatures(map, tilesByType.wall || []);
        
        // Trees and rocks (decorations)
        this.generateVegetation(map, tilesByType.decoration || []);
        
        return map;
    }

    static generateWaterFeatures(map, walls) {
        if (walls.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        if (Math.random() > 0.5) {
            this.generateRiver(map, walls, height, width);
        } else {
            this.generatePond(map, walls, height, width);
        }
    }

    static generateRiver(map, walls, height, width) {
        const riverY = Math.floor(height * (0.3 + Math.random() * 0.4));
        for (let x = 0; x < width; x++) {
            map[riverY][x] = this.getRandomTile(walls);
            if (Math.random() > 0.7 && riverY + 1 < height) {
                map[riverY + 1][x] = this.getRandomTile(walls);
            }
        }
    }

    static generatePond(map, walls, height, width) {
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const radius = Math.floor(Math.min(width, height) * 0.15);
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    if (dist <= radius) {
                        map[y][x] = this.getRandomTile(walls);
                    }
                }
            }
        }
    }

    static generateVegetation(map, decorations) {
        if (decorations.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        // Scattered trees/rocks
        const numClusters = Math.floor(Math.random() * 4) + 3;
        for (let i = 0; i < numClusters; i++) {
            const clusterX = Math.floor(Math.random() * width);
            const clusterY = Math.floor(Math.random() * height);
            const clusterSize = Math.floor(Math.random() * 5) + 2;
            
            for (let j = 0; j < clusterSize; j++) {
                const x = clusterX + Math.floor(Math.random() * 6) - 3;
                const y = clusterY + Math.floor(Math.random() * 6) - 3;
                
                this.placeTileAt(map, decorations, x, y);
            }
        }
    }
}

// Export for use in other modules
window.BaseMapGenerator = BaseMapGenerator;
window.NatureMapGenerator = NatureMapGenerator;
