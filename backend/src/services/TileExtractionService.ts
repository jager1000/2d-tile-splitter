import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type {
  TileAtlas,
  AtlasGridConfig,
  Tile,
  TileAnalysisFeatures,
  TileClassification,
} from '../types';
import { APP_CONFIG, TILE_CLASSIFICATIONS } from '../constants';

export class TileExtractionService {
  /**
   * Extract tiles from an image buffer according to grid configuration
   */
  static async extractTiles(
    imageBuffer: Buffer,
    gridConfig: AtlasGridConfig,
    tileSize: number,
    originalFilename: string
  ): Promise<TileAtlas> {
    const imageInfo = await sharp(imageBuffer).metadata();
    if (!imageInfo.width || !imageInfo.height) {
      throw new Error('Invalid image dimensions');
    }

    const grid = this.calculateGrid({ width: imageInfo.width, height: imageInfo.height }, gridConfig);
    const tiles = await this.extractTilesFromGrid(imageBuffer, grid, tileSize);
    
    // Convert original image to base64
    const originalImageData = `data:image/png;base64,${(await sharp(imageBuffer).png().toBuffer()).toString('base64')}`;

    const atlas: TileAtlas = {
      id: uuidv4(),
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

  /**
   * Calculate the optimal grid configuration
   */
  private static calculateGrid(image: { width: number; height: number }, config: AtlasGridConfig) {
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

    // Auto-detect optimal grid
    return this.detectOptimalGrid(image);
  }

  /**
   * Auto-detect the best grid configuration for an atlas
   */
  private static detectOptimalGrid(image: { width: number; height: number }) {
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

      // Check if this creates reasonable tile sizes
      if (
        tileWidth >= APP_CONFIG.MIN_TILE_SIZE &&
        tileWidth <= APP_CONFIG.MAX_TILE_SIZE &&
        tileHeight >= APP_CONFIG.MIN_TILE_SIZE &&
        tileHeight <= APP_CONFIG.MAX_TILE_SIZE
      ) {
        // Check if the division is clean
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

    // Fallback to 4x4 if no perfect match
    return {
      cols: 4,
      rows: 4,
      tileWidth: Math.floor(image.width / 4),
      tileHeight: Math.floor(image.height / 4),
    };
  }

  /**
   * Extract individual tiles from the grid
   */
  private static async extractTilesFromGrid(
    imageBuffer: Buffer,
    grid: { cols: number; rows: number; tileWidth: number; tileHeight: number },
    targetTileSize: number
  ): Promise<Tile[]> {
    const tiles: Tile[] = [];

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const sourceX = col * grid.tileWidth;
        const sourceY = row * grid.tileHeight;

        try {
          // Extract and resize tile using Sharp
          const tileBuffer = await sharp(imageBuffer)
            .extract({
              left: sourceX,
              top: sourceY,
              width: grid.tileWidth,
              height: grid.tileHeight,
            })
            .resize(targetTileSize, targetTileSize, { 
              kernel: sharp.kernel.nearest,
              fit: 'fill' 
            })
            .png()
            .toBuffer();

          // Check if tile has meaningful content
          if (await this.isMeaningfulTile(tileBuffer)) {
            const tileData = `data:image/png;base64,${tileBuffer.toString('base64')}`;
            const features = await this.analyzeTileFeatures(tileBuffer);
            const classification = this.classifyTileByFeatures(features);

            const tile: Tile = {
              id: uuidv4(),
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
        } catch (error) {
          // Skip tiles that can't be extracted (e.g., out of bounds)
          console.warn(`Failed to extract tile at ${col},${row}:`, error);
        }
      }
    }

    return tiles;
  }

  /**
   * Check if a tile contains meaningful visual content
   */
  private static async isMeaningfulTile(tileBuffer: Buffer): Promise<boolean> {
    try {
      const { data } = await sharp(tileBuffer).raw().toBuffer({ resolveWithObject: true });
      
      let totalAlpha = 0;
      let colorVariance = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] || 255;
        totalAlpha += alpha;
        
        const gray = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        colorVariance += Math.abs(gray - 128);
      }

      const avgAlpha = totalAlpha / pixelCount;
      const avgVariance = colorVariance / pixelCount;

      return avgAlpha > 50 && avgVariance > 5;
    } catch {
      return false;
    }
  }

  /**
   * Analyze visual features of a tile for classification
   */
  private static async analyzeTileFeatures(tileBuffer: Buffer): Promise<TileAnalysisFeatures> {
    const { data } = await sharp(tileBuffer).raw().toBuffer({ resolveWithObject: true });
    const pixelCount = data.length / 4;

    let r = 0, g = 0, b = 0;
    let edges = 0;
    let variance = 0;
    let brightness = 0;
    let hasTransparency = false;
    const colorCounts = new Map<string, number>();

    // First pass: basic statistics
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i]!;
      const green = data[i + 1]!;
      const blue = data[i + 2]!;
      const alpha = data[i + 3] || 255;

      r += red;
      g += green;
      b += blue;

      const pixelBrightness = (red + green + blue) / 3;
      brightness += pixelBrightness;

      if (alpha < 255) hasTransparency = true;

      // Count unique colors for complexity
      const colorKey = `${red},${green},${blue}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }

    const avgR = r / pixelCount;
    const avgG = g / pixelCount;
    const avgB = b / pixelCount;
    const avgBrightness = brightness / pixelCount;

    // Second pass: variance and edge detection
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i]!;
      const green = data[i + 1]!;
      const blue = data[i + 2]!;

      variance += Math.abs(red - avgR) + Math.abs(green - avgG) + Math.abs(blue - avgB);

      // Simple edge detection
      if (i > 0) {
        const prevRed = data[i - 4]!;
        const prevGreen = data[i - 3]!;
        const prevBlue = data[i - 2]!;
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

  /**
   * Classify a tile based on its visual features
   */
  private static classifyTileByFeatures(features: TileAnalysisFeatures): TileClassification {
    const { dominantColor, brightness, variance, edges, colorComplexity } = features;

    // Floor classification logic
    if (variance < 30 && edges < 50) {
      return this.classifyByColor(dominantColor, TILE_CLASSIFICATIONS.FLOOR);
    }

    // Wall classification logic
    if (edges > 200 || brightness < 50 || (dominantColor.r < 100 && dominantColor.g < 100 && dominantColor.b < 100)) {
      return TILE_CLASSIFICATIONS.WALL;
    }

    // Decoration classification logic
    if (variance > 100 || colorComplexity > 20) {
      return TILE_CLASSIFICATIONS.DECORATION;
    }

    // Default fallback based on color
    return this.classifyByColor(dominantColor, TILE_CLASSIFICATIONS.FLOOR);
  }

  /**
   * Classify based on dominant color characteristics
   */
  private static classifyByColor(color: { r: number; g: number; b: number }, defaultType: TileClassification): TileClassification {
    const { r, g, b } = color;
    const brightness = (r + g + b) / 3;

    // Green tones (nature/floors)
    if (g > r && g > b && g > 100) return TILE_CLASSIFICATIONS.FLOOR;

    // Brown/earthy tones (floors)
    if (r > 100 && g > 80 && b < 80) return TILE_CLASSIFICATIONS.FLOOR;

    // Dark or gray tones (walls)
    if (brightness < 60 || (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && brightness < 120)) {
      return TILE_CLASSIFICATIONS.WALL;
    }

    return defaultType;
  }

  /**
   * Calculate confidence score for classification
   */
  private static calculateClassificationConfidence(features: TileAnalysisFeatures, classification: TileClassification): number {
    const { variance, edges, brightness } = features;
    let confidence = 0.5; // Base confidence

    switch (classification) {
      case TILE_CLASSIFICATIONS.FLOOR:
        // Higher confidence for low variance, moderate brightness
        if (variance < 20) confidence += 0.3;
        if (brightness > 80 && brightness < 200) confidence += 0.2;
        break;

      case TILE_CLASSIFICATIONS.WALL:
        // Higher confidence for high edges or low brightness
        if (edges > 150) confidence += 0.3;
        if (brightness < 80) confidence += 0.2;
        break;

      case TILE_CLASSIFICATIONS.DECORATION:
        // Higher confidence for high variance
        if (variance > 80) confidence += 0.3;
        if (features.colorComplexity > 15) confidence += 0.2;
        break;
    }

    return Math.min(1.0, Math.max(0.1, confidence));
  }
}
