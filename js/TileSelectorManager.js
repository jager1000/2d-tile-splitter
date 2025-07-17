// Tile Selector Popup Manager
class TileSelectorManager {
    constructor(appState, uiManager) {
        this.appState = appState;
        this.uiManager = uiManager;
    }

    showTileSelector() {
        const tiles = this.appState.getTiles();
        if (tiles.length === 0) return;
        
        const popup = document.getElementById('tileSelectorPopup');
        const overlay = document.getElementById('tileSelectorOverlay');
        const grid = document.getElementById('tileSelectorGrid');
        
        this.populateGrid(grid, tiles);
        
        overlay.style.display = 'block';
        popup.style.display = 'block';
    }

    populateGrid(grid, tiles) {
        grid.innerHTML = '';
        
        tiles.forEach((tile, index) => {
            const div = this.createSelectorItem(tile, index);
            grid.appendChild(div);
        });
    }

    createSelectorItem(tile, index) {
        const div = document.createElement('div');
        div.className = 'tile-selector-item';
        
        if (this.appState.getPaintTileIndex() === index) {
            div.classList.add('active');
        }
        
        const img = document.createElement('img');
        img.src = tile;
        div.appendChild(img);
        
        div.addEventListener('click', () => {
            this.appState.setPaintTileIndex(index);
            this.uiManager.updatePaintPreview(this.appState);
            this.closeTileSelector();
        });
        
        return div;
    }

    closeTileSelector() {
        document.getElementById('tileSelectorPopup').style.display = 'none';
        document.getElementById('tileSelectorOverlay').style.display = 'none';
    }
}

// Export for use in other modules
window.TileSelectorManager = TileSelectorManager;
