// Image Analysis Utilities
class ImageAnalyzer {
    static analyzeTexture(imageData) {
        const data = imageData.data;
        const pixelCount = data.length / 4;

        const edges = this.calculateEdges(data);
        const avgBrightness = this.calculateAverageBrightness(data);
        const variance = this.calculateVariance(data, pixelCount);

        return { edges, variance, avgBrightness };
    }

    static calculateEdges(data) {
        let edges = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            
            if (i > 0) {
                const prevBrightness = (data[i-4] + data[i-3] + data[i-2]) / 3;
                if (Math.abs(brightness - prevBrightness) > 30) {
                    edges++;
                }
            }
        }
        
        return edges;
    }

    static calculateAverageBrightness(data) {
        let totalBrightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            totalBrightness += brightness;
        }
        
        return totalBrightness / (data.length / 4);
    }

    static calculateVariance(data, pixelCount) {
        const avgColor = this.calculateAverageColor(data, pixelCount);
        let variance = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            variance += Math.abs(data[i] - avgColor.r) + 
                       Math.abs(data[i+1] - avgColor.g) + 
                       Math.abs(data[i+2] - avgColor.b);
        }
        
        return variance / pixelCount;
    }

    static calculateAverageColor(data, pixelCount) {
        let r = 0, g = 0, b = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        
        return {
            r: r / pixelCount,
            g: g / pixelCount,
            b: b / pixelCount
        };
    }

    static getDominantColor(imageData) {
        const data = imageData.data;
        const pixelCount = data.length / 4;
        return this.calculateAverageColor(data, pixelCount);
    }

    static isMeaningfulTile(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalAlpha = 0;
        let colorVariance = 0;
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            totalAlpha += data[i + 3]; // Alpha channel
            
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            colorVariance += Math.abs(gray - 128);
        }
        
        const avgAlpha = totalAlpha / pixelCount;
        const avgVariance = colorVariance / pixelCount;
        
        // Consider tile meaningful if it's not completely transparent and has some variation
        return avgAlpha > 50 && avgVariance > 5;
    }
}

// Export for use in other modules
window.ImageAnalyzer = ImageAnalyzer;
