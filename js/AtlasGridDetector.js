// Atlas Grid Detection Utility
class AtlasGridDetector {
    static detectBestGrid(imageWidth, imageHeight) {
        // Try common grid dimensions first (for NxN atlases)
        const commonGrids = [
            { cols: 16, rows: 16 },
            { cols: 8, rows: 8 },
            { cols: 4, rows: 4 },
            { cols: 2, rows: 2 },
            { cols: 32, rows: 32 },
            { cols: 12, rows: 12 },
            { cols: 6, rows: 6 }
        ];
        
        for (const grid of commonGrids) {
            const tileWidth = imageWidth / grid.cols;
            const tileHeight = imageHeight / grid.rows;
            
            // Check if this creates reasonable tile sizes (between 8 and 128 pixels)
            if (this.isReasonableTileSize(tileWidth, tileHeight)) {
                // Check if the division is clean (no significant remainder)
                const remainderX = imageWidth % grid.cols;
                const remainderY = imageHeight % grid.rows;
                
                if (remainderX === 0 && remainderY === 0) {
                    console.log(`Auto-detected grid: ${grid.cols}×${grid.rows} (tile size: ${tileWidth}×${tileHeight})`);
                    return grid;
                }
            }
        }
        
        // If no perfect match, try to find the best fit
        return this.findBestFitGrid(imageWidth, imageHeight);
    }

    static isReasonableTileSize(width, height) {
        return width >= 8 && width <= 128 && height >= 8 && height <= 128;
    }

    static findBestFitGrid(imageWidth, imageHeight) {
        let bestGrid = { cols: 4, rows: 4 };
        let bestScore = 0;
        
        for (let cols = 2; cols <= 32; cols++) {
            for (let rows = 2; rows <= 32; rows++) {
                const tileWidth = imageWidth / cols;
                const tileHeight = imageHeight / rows;
                
                if (this.isReasonableTileSize(tileWidth, tileHeight)) {
                    const remainderX = imageWidth % cols;
                    const remainderY = imageHeight % rows;
                    const totalRemainder = remainderX + remainderY;
                    
                    // Score based on how clean the division is (lower remainder = better)
                    const score = 1000 - totalRemainder;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestGrid = { cols, rows };
                    }
                }
            }
        }
        
        console.log(`Best fit grid: ${bestGrid.cols}×${bestGrid.rows}`);
        return bestGrid;
    }

    static parseGridFromInput(gridValue) {
        if (gridValue === 'auto') {
            return null; // Will trigger auto-detection
        } else if (gridValue === 'custom') {
            return null; // Will be handled by custom input fields
        } else {
            const [cols, rows] = gridValue.split('x').map(n => parseInt(n));
            return { cols, rows };
        }
    }

    static getCustomGrid() {
        const cols = parseInt(document.getElementById('customCols').value);
        const rows = parseInt(document.getElementById('customRows').value);
        return { cols, rows };
    }
}

// Export for use in other modules
window.AtlasGridDetector = AtlasGridDetector;
