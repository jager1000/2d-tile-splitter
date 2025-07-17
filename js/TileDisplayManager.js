// Tile Display Manager
class TileDisplayManager {
    constructor(appState, uiManager) {
        this.appState = appState;
        this.uiManager = uiManager;
    }

    displayTiles() {
        const preview = document.getElementById('tilesPreview');
        preview.innerHTML = '';
        
        const tiles = this.appState.getTiles();
        
        tiles.forEach((tile, index) => {
            const tileElement = this.createTileElement(tile, index);
            preview.appendChild(tileElement);
        });
        
        this.uiManager.showSection('tilesSection');
        this.uiManager.showSection('paintSection');
    }

    createTileElement(tile, index) {
        const div = document.createElement('div');
        div.className = 'tile-item';
        div.dataset.index = index;
        
        this.updateTileSelection(div, index);
        
        const img = document.createElement('img');
        img.src = tile;
        
        const type = document.createElement('div');
        type.className = 'tile-type';
        type.textContent = this.appState.getTileClassification(index);
        
        div.appendChild(img);
        div.appendChild(type);
        
        div.addEventListener('click', (e) => this.handleTileClick(e, index, div));
        
        return div;
    }

    updateTileSelection(div, index) {
        div.classList.remove('selected', 'multi-selected');
        
        if (this.appState.isSelected(index)) {
            const selectedCount = this.appState.getSelectedTiles().length;
            if (selectedCount > 1) {
                div.classList.add('multi-selected');
            } else {
                div.classList.add('selected');
            }
        }
    }

    handleTileClick(e, index, div) {
        const isMultiSelect = e.ctrlKey || e.metaKey;
        
        if (isMultiSelect) {
            this.handleMultiSelect(index, div);
        } else {
            this.handleSingleSelect(index, div);
        }
        
        this.uiManager.updateTileStats(this.appState);
        this.uiManager.updatePaintPreview(this.appState);
    }

    handleMultiSelect(index, div) {
        if (this.appState.isSelected(index)) {
            this.appState.deselectTile(index);
            div.classList.remove('selected', 'multi-selected');
        } else {
            this.appState.selectTile(index, true);
            const selectedCount = this.appState.getSelectedTiles().length;
            if (selectedCount > 1) {
                div.classList.add('multi-selected');
            } else {
                div.classList.add('selected');
            }
        }
    }

    handleSingleSelect(index) {
        // Clear all selections first
        this.appState.clearSelection();
        document.querySelectorAll('.tile-item.selected, .tile-item.multi-selected').forEach(item => {
            item.classList.remove('selected', 'multi-selected');
        });
        
        // Select the clicked tile
        this.appState.selectTile(index);
        const div = document.querySelector(`[data-index="${index}"]`);
        if (div) {
            div.classList.add('selected');
        }
    }

    updateTileSelectionDisplay() {
        document.querySelectorAll('.tile-item').forEach(item => {
            const index = parseInt(item.dataset.index);
            this.updateTileSelection(item, index);
        });
    }
}

// Export for use in other modules
window.TileDisplayManager = TileDisplayManager;
