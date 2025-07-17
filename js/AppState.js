// Application State Management
class AppState {
    constructor() {
        this.tilesetImage = null;
        this.tiles = [];
        this.selectedTiles = new Set();
        this.tileClassifications = new Map();
        this.currentMap = null;
        this.paintMode = false;
        this.paintTileIndex = null;
        this.tileStates = {};
        this.manualClassification = { floor: [], wall: [], decoration: [] };
    }

    setTilesetImage(image) {
        this.tilesetImage = image;
    }

    getTilesetImage() {
        return this.tilesetImage;
    }

    addTile(tileData) {
        this.tiles.push(tileData);
        return this.tiles.length - 1;
    }

    getTiles() {
        return this.tiles;
    }

    getTile(index) {
        return this.tiles[index];
    }

    clearTiles() {
        this.tiles = [];
        this.selectedTiles.clear();
        this.tileClassifications.clear();
    }

    selectTile(index, multiSelect = false) {
        if (!multiSelect) {
            this.selectedTiles.clear();
        }
        this.selectedTiles.add(index);
    }

    deselectTile(index) {
        this.selectedTiles.delete(index);
    }

    isSelected(index) {
        return this.selectedTiles.has(index);
    }

    getSelectedTiles() {
        return Array.from(this.selectedTiles);
    }

    clearSelection() {
        this.selectedTiles.clear();
    }

    setTileClassification(index, classification) {
        this.tileClassifications.set(index, classification);
    }

    getTileClassification(index) {
        return this.tileClassifications.get(index);
    }

    setCurrentMap(map) {
        this.currentMap = map;
    }

    getCurrentMap() {
        return this.currentMap;
    }

    setPaintMode(enabled) {
        this.paintMode = enabled;
    }

    isPaintModeEnabled() {
        return this.paintMode;
    }

    setPaintTileIndex(index) {
        this.paintTileIndex = index;
    }

    getPaintTileIndex() {
        return this.paintTileIndex;
    }

    assignTilesToType(tileIndices, type) {
        // Remove from existing categories
        Object.keys(this.manualClassification).forEach(category => {
            this.manualClassification[category] = this.manualClassification[category].filter(
                index => !tileIndices.includes(index)
            );
        });

        // Add to new category
        this.manualClassification[type].push(...tileIndices);

        // Update classifications
        tileIndices.forEach(index => {
            this.setTileClassification(index, type);
        });
    }

    getManualClassification() {
        return this.manualClassification;
    }

    getTilesByType() {
        const tilesByType = { floor: [], wall: [], decoration: [] };

        // Use manual classifications if available
        Object.keys(this.manualClassification).forEach(type => {
            if (this.manualClassification[type].length > 0) {
                tilesByType[type] = [...this.manualClassification[type]];
            }
        });

        // If no manual classifications, use AI classifications
        if (tilesByType.floor.length === 0 && tilesByType.wall.length === 0 && tilesByType.decoration.length === 0) {
            this.tileClassifications.forEach((type, index) => {
                tilesByType[type].push(index);
            });
        }

        return tilesByType;
    }
}

// Export for use in other modules
window.AppState = AppState;
