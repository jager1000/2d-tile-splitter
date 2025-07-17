// Paint Mode Handler
class PaintModeHandler {
    constructor(appState, mapRenderer) {
        this.appState = appState;
        this.mapRenderer = mapRenderer;
        this.isPainting = false;
    }

    setupPaintMode() {
        const outputCanvas = document.getElementById('outputCanvas');
        if (!outputCanvas) return;
        
        // Remove existing listeners
        this.removePaintListeners();
        
        // Add new listeners
        this.mouseDownHandler = (e) => this.handleMouseDown(e, outputCanvas);
        this.mouseMoveHandler = (e) => this.handleMouseMove(e, outputCanvas);
        this.mouseUpHandler = () => this.handleMouseUp();
        this.mouseLeaveHandler = () => this.handleMouseLeave();
        
        outputCanvas.addEventListener('mousedown', this.mouseDownHandler);
        outputCanvas.addEventListener('mousemove', this.mouseMoveHandler);
        outputCanvas.addEventListener('mouseup', this.mouseUpHandler);
        outputCanvas.addEventListener('mouseleave', this.mouseLeaveHandler);
    }

    removePaintListeners() {
        const outputCanvas = document.getElementById('outputCanvas');
        if (!outputCanvas) return;
        
        if (this.mouseDownHandler) outputCanvas.removeEventListener('mousedown', this.mouseDownHandler);
        if (this.mouseMoveHandler) outputCanvas.removeEventListener('mousemove', this.mouseMoveHandler);
        if (this.mouseUpHandler) outputCanvas.removeEventListener('mouseup', this.mouseUpHandler);
        if (this.mouseLeaveHandler) outputCanvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
    }

    handleMouseDown(e, canvas) {
        if (this.appState.isPaintModeEnabled()) {
            this.isPainting = true;
            this.paintAtPosition(e, canvas);
        }
    }

    handleMouseMove(e, canvas) {
        if (this.isPainting && this.appState.isPaintModeEnabled()) {
            this.paintAtPosition(e, canvas);
        }
    }

    handleMouseUp() {
        this.isPainting = false;
    }

    handleMouseLeave() {
        this.isPainting = false;
    }

    paintAtPosition(e, canvas) {
        if (!this.appState.isPaintModeEnabled() || this.appState.getPaintTileIndex() === null) return;
        
        const coordinates = this.getCanvasCoordinates(e, canvas);
        const currentMap = this.appState.getCurrentMap();
        
        if (this.isValidPosition(coordinates, currentMap)) {
            currentMap[coordinates.y][coordinates.x] = this.appState.getPaintTileIndex();
            this.mapRenderer.renderMap();
        }
    }

    getCanvasCoordinates(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const tileSize = parseInt(document.getElementById('tileSize').value);
        
        const x = Math.floor((e.clientX - rect.left) * scaleX / tileSize);
        const y = Math.floor((e.clientY - rect.top) * scaleY / tileSize);
        
        return { x, y };
    }

    isValidPosition(coordinates, map) {
        return coordinates.x >= 0 && coordinates.x < map[0].length && 
               coordinates.y >= 0 && coordinates.y < map.length;
    }
}

// Export for use in other modules
window.PaintModeHandler = PaintModeHandler;
