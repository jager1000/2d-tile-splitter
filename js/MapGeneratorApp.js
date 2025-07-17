// Main Application Controller
class MapGeneratorApp {
    constructor() {
        this.appState = new AppState();
        this.uiManager = new UIStateManager();
        this.fileUploadHandler = new FileUploadHandler(this.appState, this.uiManager, () => this.onTilesetLoaded());
        this.tileExtractor = new TileExtractor(this.appState);
        this.tileDisplayManager = new TileDisplayManager(this.appState, this.uiManager);
        this.tileSelectorManager = new TileSelectorManager(this.appState, this.uiManager);
        this.mapRenderer = new MapRenderer(this.appState);
        this.paintModeHandler = new PaintModeHandler(this.appState, this.mapRenderer);
    }

    initialize() {
        this.initializeEventListeners();
        this.fileUploadHandler.initialize();
    }

    initializeEventListeners() {
        // Tile size change
        document.getElementById('tileSize').addEventListener('change', () => {
            if (this.appState.getTilesetImage()) {
                this.reprocessTexture();
            }
        });

        // Atlas grid change
        document.getElementById('atlasGrid').addEventListener('change', () => {
            this.uiManager.updateModeVisibility();
            if (this.appState.getTilesetImage()) {
                this.reprocessTexture();
            }
        });

        // Texture mode change
        document.getElementById('textureModeSelect').addEventListener('change', () => {
            this.uiManager.updateModeVisibility();
            if (this.appState.getTilesetImage()) {
                this.reprocessTexture();
            }
        });

        // Paint mode toggle
        document.getElementById('paintModeBtn').addEventListener('click', () => {
            this.togglePaintMode();
        });

        // Paint tile preview click
        document.getElementById('paintTilePreview').addEventListener('click', () => {
            this.tileSelectorManager.showTileSelector();
        });

        // Tile selector overlay click
        document.getElementById('tileSelectorOverlay').addEventListener('click', () => {
            this.tileSelectorManager.closeTileSelector();
        });

        // Generate map button
        document.getElementById('generateMapBtn').addEventListener('click', () => {
            this.generateMap();
        });

        // Export map button
        document.getElementById('exportMapBtn').addEventListener('click', () => {
            this.exportMap();
        });

        // Assign tiles button
        document.getElementById('assignTilesBtn').addEventListener('click', () => {
            this.assignSelectedTiles();
        });
    }

    reprocessTexture() {
        if (this.appState.getTilesetImage()) {
            this.uiManager.updateModeVisibility();
            const result = this.tileExtractor.extractTiles();
            this.tileDisplayManager.displayTiles();
            this.uiManager.updateProcessingResult(result, 'success');
            this.uiManager.updateTileStats(this.appState);
            this.uiManager.showStatus('Texture reprocessed!', 'success');
        }
    }

    extractAndDisplayTiles() {
        const result = this.tileExtractor.extractTiles();
        this.tileDisplayManager.displayTiles();
        this.uiManager.updateProcessingResult(result, 'success');
        this.uiManager.updateTileStats(this.appState);
    }

    assignSelectedTiles() {
        const assignType = document.getElementById('tileAssignType').value;
        if (!assignType) return;
        
        const selectedTiles = this.appState.getSelectedTiles();
        if (selectedTiles.length === 0) {
            alert('Please select at least one tile first (use Ctrl+Click for multiple selection)');
            return;
        }
        
        this.appState.assignTilesToType(selectedTiles, assignType);
        this.tileDisplayManager.displayTiles();
        this.uiManager.updateTileStats(this.appState);
        
        console.log('Tiles assigned:', { type: assignType, count: selectedTiles.length });
        console.log('Current manual classification:', this.appState.getManualClassification());
        
        // Clear selection after assignment
        this.appState.clearSelection();
        this.tileDisplayManager.displayTiles();
    }

    togglePaintMode() {
        this.uiManager.togglePaintMode(this.appState);
        if (this.appState.isPaintModeEnabled()) {
            this.paintModeHandler.setupPaintMode();
        } else {
            this.paintModeHandler.removePaintListeners();
        }
    }

    generateMap() {
        const tiles = this.appState.getTiles();
        if (tiles.length === 0) {
            this.uiManager.showStatus('Please upload and process a tileset first', 'error');
            return;
        }

        const mapSize = parseInt(document.getElementById('mapSize').value);
        const useFloors = document.getElementById('useFloors').checked;
        const useWalls = document.getElementById('useWalls').checked;
        const useDecorations = document.getElementById('useDecorations').checked;
        const environmentType = document.getElementById('environmentType').value;

        // Get tiles organized by type
        const tilesByType = this.appState.getTilesByType();

        // Filter by user preferences
        if (!useFloors) tilesByType.floor = [];
        if (!useWalls) tilesByType.wall = [];
        if (!useDecorations) tilesByType.decoration = [];

        console.log('Generating map with tiles:', tilesByType);

        if (tilesByType.floor.length === 0 && tilesByType.wall.length === 0 && tilesByType.decoration.length === 0) {
            this.uiManager.showStatus('No tiles available for generation. Please classify some tiles first.', 'error');
            return;
        }

        // Generate the map
        const generatedMap = MapGeneratorFactory.generate(mapSize, mapSize, tilesByType, environmentType);
        this.appState.setCurrentMap(generatedMap);
        this.mapRenderer.renderMap();
        this.paintModeHandler.setupPaintMode();
        
        this.uiManager.showStatus('Map generated successfully!', 'success');
    }

    exportMap() {
        const result = this.mapRenderer.exportMap();
        this.uiManager.showStatus(result.message, result.success ? 'success' : 'error');
    }

    // Public method to be called when tileset is loaded
    onTilesetLoaded() {
        this.extractAndDisplayTiles();
    }
}

// Export for use in other modules
window.MapGeneratorApp = MapGeneratorApp;
