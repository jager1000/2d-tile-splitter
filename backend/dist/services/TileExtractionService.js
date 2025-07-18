"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TileExtractionService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
class TileExtractionService {
    static async extractTiles(imageBuffer, gridConfig, tileSize, originalFilename) {
        const imageInfo = await (0, sharp_1.default)(imageBuffer).metadata();
        if (!imageInfo.width || !imageInfo.height) {
            throw new Error('Invalid image dimensions');
        }
        const grid = this.calculateGrid({ width: imageInfo.width, height: imageInfo.height }, gridConfig);
        const tiles = await this.extractTilesFromGrid(imageBuffer, grid, tileSize);
        const originalImageData = `data:image/png;base64,${(await (0, sharp_1.default)(imageBuffer).png().toBuffer()).toString('base64')}`;
        const atlas = {
            id: (0, uuid_1.v4)(),
            name: originalFilename || `Atlas-${Date.now()}`,
            imageData: originalImageData,
            originalImage: {
                width: imageInfo.width,
                height: imageInfo.height,
            },
            grid,
            tiles,
            createdAt: new Date(),
        };
        return atlas;
    }
    static calculateGrid(image, config) {
        if (config.type === 'custom' && config.cols && config.rows) {
            return {
                cols: config.cols,
                rows: config.rows,
                tileWidth: Math.floor(image.width / config.cols),
                tileHeight: Math.floor(image.height / config.rows),
            };
        }
        if (config.type === 'preset' && config.cols && config.rows) {
            return {
                cols: config.cols,
                rows: config.rows,
                tileWidth: Math.floor(image.width / config.cols),
                tileHeight: Math.floor(image.height / config.rows),
            };
        }
        return this.detectOptimalGrid(image);
    }
    static detectOptimalGrid(image) {
        const commonGrids = [
            { cols: 16, rows: 16 },
            { cols: 8, rows: 8 },
            { cols: 4, rows: 4 },
            { cols: 2, rows: 2 },
            { cols: 32, rows: 32 },
            { cols: 12, rows: 12 },
            { cols: 6, rows: 6 },
        ];
        for (const grid of commonGrids) {
            const tileWidth = image.width / grid.cols;
            const tileHeight = image.height / grid.rows;
            if (tileWidth >= constants_1.APP_CONFIG.MIN_TILE_SIZE &&
                tileWidth <= constants_1.APP_CONFIG.MAX_TILE_SIZE &&
                tileHeight >= constants_1.APP_CONFIG.MIN_TILE_SIZE &&
                tileHeight <= constants_1.APP_CONFIG.MAX_TILE_SIZE) {
                const remainderX = image.width % grid.cols;
                const remainderY = image.height % grid.rows;
                if (remainderX === 0 && remainderY === 0) {
                    return {
                        cols: grid.cols,
                        rows: grid.rows,
                        tileWidth: Math.floor(tileWidth),
                        tileHeight: Math.floor(tileHeight),
                    };
                }
            }
        }
        return {
            cols: 4,
            rows: 4,
            tileWidth: Math.floor(image.width / 4),
            tileHeight: Math.floor(image.height / 4),
        };
    }
    static async extractTilesFromGrid(imageBuffer, grid, targetTileSize) {
        const tiles = [];
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const sourceX = col * grid.tileWidth;
                const sourceY = row * grid.tileHeight;
                try {
                    const tileBuffer = await (0, sharp_1.default)(imageBuffer)
                        .extract({
                        left: sourceX,
                        top: sourceY,
                        width: grid.tileWidth,
                        height: grid.tileHeight,
                    })
                        .resize(targetTileSize, targetTileSize, {
                        kernel: sharp_1.default.kernel.nearest,
                        fit: 'fill'
                    })
                        .png()
                        .toBuffer();
                    if (await this.isMeaningfulTile(tileBuffer)) {
                        const tileData = `data:image/png;base64,${tileBuffer.toString('base64')}`;
                        const features = await this.analyzeTileFeatures(tileBuffer);
                        const classification = this.classifyTileByFeatures(features);
                        const tile = {
                            id: (0, uuid_1.v4)(),
                            imageData: tileData,
                            classification,
                            confidence: this.calculateClassificationConfidence(features, classification),
                            metadata: {
                                sourceX,
                                sourceY,
                                width: grid.tileWidth,
                                height: grid.tileHeight,
                            },
                        };
                        tiles.push(tile);
                    }
                }
                catch (error) {
                    console.warn(`Failed to extract tile at ${col},${row}:`, error);
                }
            }
        }
        return tiles;
    }
    static async isMeaningfulTile(tileBuffer) {
        try {
            const { data } = await (0, sharp_1.default)(tileBuffer).raw().toBuffer({ resolveWithObject: true });
            let totalAlpha = 0;
            let colorVariance = 0;
            const pixelCount = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3] || 255;
                totalAlpha += alpha;
                const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                colorVariance += Math.abs(gray - 128);
            }
            const avgAlpha = totalAlpha / pixelCount;
            const avgVariance = colorVariance / pixelCount;
            return avgAlpha > 50 && avgVariance > 5;
        }
        catch {
            return false;
        }
    }
    static async analyzeTileFeatures(tileBuffer) {
        const { data } = await (0, sharp_1.default)(tileBuffer).raw().toBuffer({ resolveWithObject: true });
        const pixelCount = data.length / 4;
        let r = 0, g = 0, b = 0;
        let edges = 0;
        let variance = 0;
        let brightness = 0;
        let hasTransparency = false;
        const colorCounts = new Map();
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            const alpha = data[i + 3] || 255;
            r += red;
            g += green;
            b += blue;
            const pixelBrightness = (red + green + blue) / 3;
            brightness += pixelBrightness;
            if (alpha < 255)
                hasTransparency = true;
            const colorKey = `${red},${green},${blue}`;
            colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }
        const avgR = r / pixelCount;
        const avgG = g / pixelCount;
        const avgB = b / pixelCount;
        const avgBrightness = brightness / pixelCount;
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            variance += Math.abs(red - avgR) + Math.abs(green - avgG) + Math.abs(blue - avgB);
            if (i > 0) {
                const prevRed = data[i - 4];
                const prevGreen = data[i - 3];
                const prevBlue = data[i - 2];
                const currentBrightness = (red + green + blue) / 3;
                const prevBrightness = (prevRed + prevGreen + prevBlue) / 3;
                if (Math.abs(currentBrightness - prevBrightness) > 30) {
                    edges++;
                }
            }
        }
        return {
            dominantColor: { r: avgR, g: avgG, b: avgB },
            brightness: avgBrightness,
            variance: variance / pixelCount,
            edges,
            hasTransparency,
            colorComplexity: colorCounts.size,
        };
    }
    static classifyTileByFeatures(features) {
        const { dominantColor, brightness, variance, edges, colorComplexity } = features;
        if (variance < 30 && edges < 50) {
            return this.classifyByColor(dominantColor, constants_1.TILE_CLASSIFICATIONS.FLOOR);
        }
        if (edges > 200 || brightness < 50 || (dominantColor.r < 100 && dominantColor.g < 100 && dominantColor.b < 100)) {
            return constants_1.TILE_CLASSIFICATIONS.WALL;
        }
        if (variance > 100 || colorComplexity > 20) {
            return constants_1.TILE_CLASSIFICATIONS.DECORATION;
        }
        return this.classifyByColor(dominantColor, constants_1.TILE_CLASSIFICATIONS.FLOOR);
    }
    static classifyByColor(color, defaultType) {
        const { r, g, b } = color;
        const brightness = (r + g + b) / 3;
        if (g > r && g > b && g > 100)
            return constants_1.TILE_CLASSIFICATIONS.FLOOR;
        if (r > 100 && g > 80 && b < 80)
            return constants_1.TILE_CLASSIFICATIONS.FLOOR;
        if (brightness < 60 || (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && brightness < 120)) {
            return constants_1.TILE_CLASSIFICATIONS.WALL;
        }
        return defaultType;
    }
    static calculateClassificationConfidence(features, classification) {
        const { variance, edges, brightness } = features;
        let confidence = 0.5;
        switch (classification) {
            case constants_1.TILE_CLASSIFICATIONS.FLOOR:
                if (variance < 20)
                    confidence += 0.3;
                if (brightness > 80 && brightness < 200)
                    confidence += 0.2;
                break;
            case constants_1.TILE_CLASSIFICATIONS.WALL:
                if (edges > 150)
                    confidence += 0.3;
                if (brightness < 80)
                    confidence += 0.2;
                break;
            case constants_1.TILE_CLASSIFICATIONS.DECORATION:
                if (variance > 80)
                    confidence += 0.3;
                if (features.colorComplexity > 15)
                    confidence += 0.2;
                break;
        }
        return Math.min(1.0, Math.max(0.1, confidence));
    }
}
exports.TileExtractionService = TileExtractionService;
//# sourceMappingURL=TileExtractionService.js.map