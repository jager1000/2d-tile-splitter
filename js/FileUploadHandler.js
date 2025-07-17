// File Upload Handler
class FileUploadHandler {
    constructor(appState, uiManager, onTilesetLoadedCallback) {
        this.appState = appState;
        this.uiManager = uiManager;
        this.onTilesetLoadedCallback = onTilesetLoadedCallback;
    }

    initialize() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!uploadArea || !fileInput) {
            console.error('FileUploadHandler: Required elements not found');
            return;
        }

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e, uploadArea));
        uploadArea.addEventListener('dragleave', () => this.handleDragLeave(uploadArea));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e, uploadArea));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    handleDragOver(e, uploadArea) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    }

    handleDragLeave(uploadArea) {
        uploadArea.classList.remove('dragover');
    }

    handleDrop(e, uploadArea) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        this.handleFile(e.dataTransfer.files[0]);
    }

    handleFileSelect(e) {
        this.handleFile(e.target.files[0]);
    }

    handleFile(file) {
        if (!this.validateFile(file)) {
            this.uiManager.showStatus('Please upload an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => this.processImage(e.target.result);
        reader.readAsDataURL(file);
    }

    validateFile(file) {
        return file && file.type.startsWith('image/');
    }

    processImage(dataURL) {
        const image = new Image();
        image.onload = () => {
            this.appState.setTilesetImage(image);
            this.uiManager.showSection('textureMode');
            this.uiManager.updateModeVisibility();
            this.uiManager.showStatus('Tileset loaded successfully!', 'success');
            
            // Trigger tile extraction and display
            if (this.onTilesetLoadedCallback) {
                this.onTilesetLoadedCallback();
            }
        };
        image.src = dataURL;
    }
}

// Export for use in other modules
window.FileUploadHandler = FileUploadHandler;
