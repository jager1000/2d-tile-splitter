// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if all required classes are available
    const requiredClasses = [
        'AppState', 'UIStateManager', 'FileUploadHandler', 'TileExtractor', 
        'TileDisplayManager', 'TileSelectorManager', 'MapRenderer', 'PaintModeHandler'
    ];
    
    const missing = requiredClasses.filter(className => !window[className]);
    if (missing.length > 0) {
        console.error('Missing required classes:', missing);
        return;
    }
    
    // Initialize the application
    try {
        window.app = new MapGeneratorApp();
        window.app.initialize();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Application initialization failed:', error);
    }
});

// Legacy global functions for HTML event handlers
function reprocessTexture() {
    if (window.app) window.app.reprocessTexture();
}

function showTileSelector() {
    if (window.app) window.app.tileSelectorManager.showTileSelector();
}

function closeTileSelector() {
    if (window.app) window.app.tileSelectorManager.closeTileSelector();
}

function assignSelectedTiles() {
    if (window.app) window.app.assignSelectedTiles();
}

function togglePaintMode() {
    if (window.app) window.app.togglePaintMode();
}

function generateMap() {
    if (window.app) window.app.generateMap();
}

function exportMap() {
    if (window.app) window.app.exportMap();
}
