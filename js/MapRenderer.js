// Map Renderer
class MapRenderer {
    constructor(appState) {
        this.appState = appState;
    }

    renderMap() {
        const currentMap = this.appState.getCurrentMap();
        if (!currentMap) return;

        const canvas = document.getElementById('outputCanvas');
        const ctx = canvas.getContext('2d');
        const tileSize = parseInt(document.getElementById('tileSize').value);
        
        this.setupCanvas(canvas, currentMap, tileSize);
        this.drawMap(ctx, currentMap, tileSize);
    }

    setupCanvas(canvas, map, tileSize) {
        const mapWidth = map[0].length;
        const mapHeight = map.length;
        
        canvas.width = mapWidth * tileSize;
        canvas.height = mapHeight * tileSize;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
    }

    drawMap(ctx, map, tileSize) {
        const tiles = this.appState.getTiles();
        const mapHeight = map.length;
        const mapWidth = map[0].length;
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tileIndex = map[y][x];
                if (tileIndex !== null && tiles[tileIndex]) {
                    this.drawTile(ctx, tiles[tileIndex], x, y, tileSize);
                }
            }
        }
    }

    drawTile(ctx, tileData, x, y, tileSize) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
        };
        img.src = tileData;
    }

    exportMap() {
        const currentMap = this.appState.getCurrentMap();
        if (!currentMap) {
            return { success: false, message: 'Please generate a map first' };
        }

        const canvas = document.getElementById('outputCanvas');
        const link = document.createElement('a');
        link.download = 'generated-map.png';
        link.href = canvas.toDataURL();
        link.click();
        
        return { success: true, message: 'Map exported successfully!' };
    }
}

// Export for use in other modules
window.MapRenderer = MapRenderer;
