// Tile Extraction Service
class TileExtractor {
    constructor(appState) {
        this.appState = appState;
    }

    extractTiles() {
        const tileSize = parseInt(document.getElementById('tileSize').value);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        this.appState.clearTiles();
        
        const modeSelect = document.getElementById('textureModeSelect');
        const mode = modeSelect.value;
        
        canvas.width = tileSize;
        canvas.height = tileSize;
        
        let result;
        if (mode === 'single') {
            result = this.extractSingleTexture(canvas, ctx, tileSize);
        } else {
            result = this.extractAtlasTiles(canvas, ctx, tileSize);
        }
        
        return result;
    }

    extractSingleTexture(canvas, ctx, tileSize) {
        const image = this.appState.getTilesetImage();
        
        // Scale image to fit tile size while maintaining aspect ratio
        const scale = Math.min(tileSize / image.width, tileSize / image.height);
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        const offsetX = (tileSize - scaledWidth) / 2;
        const offsetY = (tileSize - scaledHeight) / 2;
        
        ctx.clearRect(0, 0, tileSize, tileSize);
        ctx.drawImage(
            image,
            0, 0, image.width, image.height,
            offsetX, offsetY, scaledWidth, scaledHeight
        );
        
        const tileData = canvas.toDataURL();
        const tileIndex = this.appState.addTile(tileData);
        
        const classification = TileClassifier.classifyTile(canvas, tileIndex);
        this.appState.setTileClassification(tileIndex, classification);
        this.appState.selectTile(tileIndex);
        
        return `Single texture processed (${image.width}×${image.height}px)`;
    }

    extractAtlasTiles(canvas, ctx, tileSize) {
        const image = this.appState.getTilesetImage();
        const { cols, rows } = this.getAtlasGrid(image);
        const tileWidth = Math.floor(image.width / cols);
        const tileHeight = Math.floor(image.height / rows);
        
        console.log(`Extracting atlas: ${cols}×${rows} grid, tile size: ${tileWidth}×${tileHeight}`);
        
        let validTileCount = 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const sourceX = col * tileWidth;
                const sourceY = row * tileHeight;
                
                // Skip if we're outside image bounds
                if (sourceX + tileWidth > image.width || sourceY + tileHeight > image.height) {
                    continue;
                }
                
                ctx.clearRect(0, 0, tileSize, tileSize);
                
                // Draw the tile, scaling to target tile size
                ctx.drawImage(
                    image,
                    sourceX, sourceY, tileWidth, tileHeight,
                    0, 0, tileSize, tileSize
                );
                
                // Check if tile has meaningful content
                if (ImageAnalyzer.isMeaningfulTile(canvas)) {
                    const tileData = canvas.toDataURL();
                    const tileIndex = this.appState.addTile(tileData);
                    
                    const classification = TileClassifier.classifyTile(canvas, tileIndex);
                    this.appState.setTileClassification(tileIndex, classification);
                    this.appState.selectTile(tileIndex, true);
                    validTileCount++;
                }
            }
        }
        
        return `Atlas: ${validTileCount} tiles from ${cols}×${rows} grid (${tileWidth}×${tileHeight}px each)`;
    }

    getAtlasGrid(image) {
        const gridSelect = document.getElementById('atlasGrid');
        const gridValue = gridSelect.value;
        
        if (gridValue === 'custom') {
            return AtlasGridDetector.getCustomGrid();
        } else if (gridValue === 'auto') {
            return AtlasGridDetector.detectBestGrid(image.width, image.height);
        } else {
            return AtlasGridDetector.parseGridFromInput(gridValue) || { cols: 4, rows: 4 };
        }
    }
}

// Export for use in other modules
window.TileExtractor = TileExtractor;
