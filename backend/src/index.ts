import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import type { 
  Tile, 
  TileAtlas, 
  TileClassification, 
  EnvironmentType, 
  GridConfig, 
  MapCell, 
  GeneratedMap, 
  MapGenerationParams, 
  APIResponse 
} from '../../shared/types';
import { 
  APP_CONFIG, 
  isValidTileSize, 
  isValidMapSize, 
  isValidImageType 
} from '../../shared/constants';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: APP_CONFIG.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (isValidImageType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// In-memory storage for atlases and maps
const atlases = new Map<string, TileAtlas>();
const maps = new Map<string, GeneratedMap>();

// Utility functions
// Generic utilities
const createResponse = <T>(success: boolean, data?: T, error?: string): APIResponse<T> => ({
  success,
  data,
  error,
});

const createError = (message: string, status = 500): Error & { status: number } => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const asyncHandler = (fn: (req: Request, res: Response) => Promise<APIResponse<any>>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res);
      res.json(result);
    } catch (error) {
      const status = (error as any).status || 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(status).json(createResponse(false, undefined, message));
    }
  };

// Simplified validation
const validate = {
  tileExtraction: (data: any) => {
    const tileSize = parseInt(data.tileSize);
    if (!data.gridConfig) throw createError('Missing grid configuration', 400);
    if (!isValidTileSize(tileSize)) throw createError('Invalid tile size', 400);
    return { gridConfig: JSON.parse(data.gridConfig), tileSize };
  },
  
  mapGeneration: (data: MapGenerationParams) => {
    const { width, height, tileSize, environmentType, atlasId, tilesByType } = data;
    if (!width || !height || !tileSize || !environmentType || !atlasId || !tilesByType) {
      throw createError('Missing required fields', 400);
    }
    if (!isValidMapSize(width) || !isValidMapSize(height) || !isValidTileSize(tileSize)) {
      throw createError('Invalid dimensions', 400);
    }
    return data;
  },
};

// Services
class TileExtractionService {
  static async extractTiles(
    imageBuffer: Buffer,
    gridConfig: GridConfig,
    tileSize: number,
    originalFilename: string
  ): Promise<TileAtlas> {
    const imageInfo = await sharp(imageBuffer).metadata();
    if (!imageInfo.width || !imageInfo.height) {
      throw createError('Invalid image dimensions', 400);
    }

    const grid = this.calculateGrid({ width: imageInfo.width, height: imageInfo.height }, gridConfig);
    const tiles = await this.extractTilesFromGrid(imageBuffer, grid, tileSize);
    
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

  private static calculateGrid(
    imageDimensions: { width: number; height: number },
    config: GridConfig
  ) {
    if (config.type === 'custom' && config.cols && config.rows) {
      return {
        cols: config.cols,
        rows: config.rows,
        tileWidth: Math.floor(imageDimensions.width / config.cols),
        tileHeight: Math.floor(imageDimensions.height / config.rows),
      };
    }

    if (config.type === 'preset' && config.cols && config.rows) {
      return {
        cols: config.cols,
        rows: config.rows,
        tileWidth: Math.floor(imageDimensions.width / config.cols),
        tileHeight: Math.floor(imageDimensions.height / config.rows),
      };
    }

    // Auto-detect - use simple heuristics
    const defaultCols = 8;
    const defaultRows = 8;
    
    return {
      cols: defaultCols,
      rows: defaultRows,
      tileWidth: Math.floor(imageDimensions.width / defaultCols),
      tileHeight: Math.floor(imageDimensions.height / defaultRows),
    };
  }

  private static async extractTilesFromGrid(
    imageBuffer: Buffer,
    grid: { cols: number; rows: number; tileWidth: number; tileHeight: number },
    tileSize: number
  ): Promise<Tile[]> {
    const tiles: Tile[] = [];
    const baseImage = sharp(imageBuffer);
    const metadata = await baseImage.metadata();

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const x = col * grid.tileWidth;
        const y = row * grid.tileHeight;

        // Safety check to prevent extract_area errors
        if (x + grid.tileWidth > (metadata.width || 0) || y + grid.tileHeight > (metadata.height || 0)) {
          console.warn(`Skipping tile at (${row}, ${col}) - would exceed image bounds`);
          continue;
        }

        // Use clone() to avoid Sharp instance reuse issues
        const tileBuffer = await baseImage
          .clone()
          .extract({
            left: x,
            top: y,
            width: grid.tileWidth,
            height: grid.tileHeight,
          })
          .resize(tileSize, tileSize)
          .png()
          .toBuffer();

        const tileImageData = `data:image/png;base64,${tileBuffer.toString('base64')}`;
        
        // Simple classification based on brightness
        const classification = await this.classifyTile(tileBuffer);

        tiles.push({
          id: `${row}-${col}`,
          imageData: tileImageData,
          classification,
          metadata: {
            sourceX: x,
            sourceY: y,
            width: grid.tileWidth,
            height: grid.tileHeight,
          },
        });
      }
    }

    return tiles;
  }

  private static async classifyTile(tileBuffer: Buffer): Promise<TileClassification> {
    try {
      const { data } = await sharp(tileBuffer).raw().toBuffer({ resolveWithObject: true });
      
      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i] || 0;
        const g = data[i + 1] || 0;
        const b = data[i + 2] || 0;
        totalBrightness += (r + g + b) / 3;
      }
      
      const avgBrightness = totalBrightness / (data.length / 3);
      
      // Simple classification based on brightness
      if (avgBrightness < 100) return 'wall';
      if (avgBrightness > 180) return 'decoration';
      return 'floor';
    } catch {
      return 'floor'; // Default fallback
    }
  }
}

class MapGenerationService {
  static async generateMap(params: MapGenerationParams): Promise<GeneratedMap> {
    const { width, height, tileSize, environmentType, atlasId, tilesByType } = params;

    const cells = this.generateCells(width, height, tilesByType);

    const map: GeneratedMap = {
      id: uuidv4(),
      name: `Generated Map ${Date.now()}`,
      width,
      height,
      tileSize,
      cells,
      environmentType,
      atlasId,
      createdAt: new Date(),
    };

    return map;
  }

  private static generateCells(width: number, height: number, tilesByType: Record<TileClassification, string[]>) {
    const cells = [];
    
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        let tileId = null;
        let layer: 'floor' | 'wall' | 'decoration' = 'floor';

        // Simple map generation logic
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          // Border walls
          tileId = tilesByType.wall?.[0] || null;
          layer = 'wall';
        } else if (Math.random() < 0.1) {
          // Random decorations
          tileId = tilesByType.decoration?.[0] || null;
          layer = 'decoration';
        } else {
          // Floor tiles
          const floorTiles = tilesByType.floor || [];
          tileId = floorTiles[Math.floor(Math.random() * floorTiles.length)] || null;
          layer = 'floor';
        }

        row.push({ x, y, tileId, layer });
      }
      cells.push(row);
    }

    return cells;
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Map Generator API',
    endpoints: ['/extract-tiles', '/generate-map']
  });
});

app.post('/extract-tiles', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('No image file provided', 400);
  }

  const validated = validate.tileExtraction(req.body);
  
  const atlas = await TileExtractionService.extractTiles(
    req.file.buffer,
    validated.gridConfig,
    validated.tileSize,
    req.file.originalname
  );

  atlases.set(atlas.id, atlas);
  return createResponse(true, atlas);
}));

app.post('/generate-map', asyncHandler(async (req, res) => {
  const validatedData = validate.mapGeneration(req.body);
  const map = await MapGenerationService.generateMap(validatedData);
  maps.set(map.id, map);
  return createResponse(true, map);
}));

app.get('/atlas/:id', (req, res) => {
  const atlas = atlases.get(req.params.id);
  if (!atlas) {
    res.status(404).json(createResponse(false, undefined, 'Atlas not found'));
    return;
  }
  res.json(createResponse(true, atlas));
});

app.get('/map/:id', (req, res) => {
  const map = maps.get(req.params.id);
  if (!map) {
    res.status(404).json(createResponse(false, undefined, 'Map not found'));
    return;
  }
  res.json(createResponse(true, map));
});

// Error handling
app.use((err: Error & { status?: number }, req: Request, res: Response) => {
  console.error(err);
  res.status(err.status || 500).json(createResponse(false, undefined, err.message || 'Internal server error'));
});

const PORT = process.env.PORT || 8891;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
