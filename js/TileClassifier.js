// Tile Classification Service
class TileClassifier {
    static classifyTile(canvas, index) {
        try {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const features = ImageAnalyzer.analyzeTexture(imageData);
            const dominantColor = ImageAnalyzer.getDominantColor(imageData);
            
            return this.determineClassification(features, dominantColor);
        } catch (error) {
            console.warn('Tile classification error:', error);
            return 'floor';
        }
    }

    static determineClassification(features, dominantColor) {
        if (features.edges < 50 && features.variance < 30) {
            return this.classifyByColor(dominantColor, 'floor');
        } else if (features.edges > 200 || features.avgBrightness < 50) {
            return this.classifyByColor(dominantColor, 'wall');
        } else if (features.variance > 100) {
            return 'decoration';
        } else {
            return this.classifyByColor(dominantColor, 'floor');
        }
    }

    static classifyByColor(color, defaultType) {
        const { r, g, b } = color;
        const brightness = (r + g + b) / 3;
        
        if (g > r && g > b && g > 100) return 'floor'; // Green
        if (r > 100 && g > 80 && b < 80) return 'floor'; // Brown/earthy
        if (brightness < 60 || (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && brightness < 120)) return 'wall'; // Dark or gray
        
        return defaultType;
    }
}

// Export for use in other modules
window.TileClassifier = TileClassifier;
