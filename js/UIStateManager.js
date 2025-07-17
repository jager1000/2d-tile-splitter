// UI State Manager
class UIStateManager {
    constructor() {
        this.statusTimeout = null;
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        this.statusTimeout = setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    updateProcessingResult(message, type) {
        const resultDiv = document.getElementById('processingResult');
        const color = type === 'success' ? '#00ff88' : '#ff4444';
        resultDiv.innerHTML = `<div style="color: ${color};">${message}</div>`;
    }

    updateModeVisibility() {
        const mode = document.getElementById('textureModeSelect').value;
        const atlasControls = document.getElementById('atlasControls');
        const customGrid = document.getElementById('customGrid');
        
        if (mode === 'atlas') {
            atlasControls.style.display = 'block';
            const gridValue = document.getElementById('atlasGrid').value;
            customGrid.style.display = gridValue === 'custom' ? 'block' : 'none';
        } else {
            atlasControls.style.display = 'none';
            customGrid.style.display = 'none';
        }
    }

    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }

    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    }

    updateTileStats(appState) {
        const stats = document.getElementById('tileStats');
        const counts = { floor: 0, wall: 0, decoration: 0 };
        
        appState.getSelectedTiles().forEach(index => {
            const type = appState.getTileClassification(index);
            counts[type]++;
        });
        
        stats.innerHTML = `
            <div class="stat-item">
                <span>Floors:</span>
                <span class="stat-value">${counts.floor}</span>
            </div>
            <div class="stat-item">
                <span>Walls:</span>
                <span class="stat-value">${counts.wall}</span>
            </div>
            <div class="stat-item">
                <span>Decorations:</span>
                <span class="stat-value">${counts.decoration}</span>
            </div>
            <div class="stat-item">
                <span>Total Selected:</span>
                <span class="stat-value">${appState.getSelectedTiles().length}</span>
            </div>
        `;
    }

    updatePaintPreview(appState) {
        const preview = document.getElementById('paintTilePreview');
        const paintTileIndex = appState.getPaintTileIndex();
        const tiles = appState.getTiles();
        const selectedTiles = appState.getSelectedTiles();
        
        if (paintTileIndex !== null && tiles[paintTileIndex]) {
            preview.innerHTML = `<img src="${tiles[paintTileIndex]}" style="width: 100%; height: 100%; image-rendering: pixelated;">`;
        } else if (selectedTiles.length === 1) {
            const index = selectedTiles[0];
            preview.innerHTML = `<img src="${tiles[index]}" style="width: 100%; height: 100%; image-rendering: pixelated;">`;
            appState.setPaintTileIndex(index);
        } else {
            preview.innerHTML = '<div style="color: #666; font-size: 10px; text-align: center; line-height: 44px;">Click to select</div>';
            appState.setPaintTileIndex(null);
        }
    }

    togglePaintMode(appState) {
        const paintMode = !appState.isPaintModeEnabled();
        appState.setPaintMode(paintMode);
        
        const button = document.getElementById('paintModeBtn');
        
        if (paintMode) {
            button.textContent = 'Disable Paint Mode';
            button.style.backgroundColor = '#ff4444';
            this.showPaintInstructions();
        } else {
            button.textContent = 'Enable Paint Mode';
            button.style.backgroundColor = '';
            this.hidePaintInstructions();
        }
    }

    showPaintInstructions() {
        const instructions = document.getElementById('paintInstructions');
        if (!instructions) {
            const div = document.createElement('div');
            div.id = 'paintInstructions';
            div.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #1a1a1a; border: 2px solid #00ff88; padding: 10px; border-radius: 8px; z-index: 100;';
            div.innerHTML = '<strong>Paint Mode Active:</strong> Click and drag on the map to paint tiles';
            document.body.appendChild(div);
        }
    }

    hidePaintInstructions() {
        const instructions = document.getElementById('paintInstructions');
        if (instructions) {
            instructions.remove();
        }
    }
}

// Export for use in other modules
window.UIStateManager = UIStateManager;
