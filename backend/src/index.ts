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

// Validation
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

    // Validate parameters
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid map dimensions');
    }
    
    if (!tilesByType || Object.keys(tilesByType).length === 0) {
      throw new Error('No tiles provided for map generation');
    }

    // Ensure we have at least some tiles for generation
    const allTiles = Object.values(tilesByType).flat();
    if (allTiles.length === 0) {
      throw new Error('No tiles available for map generation');
    }

    const cells = this.generateCells(width, height, tilesByType, environmentType);

    if (!cells || cells.length !== height || !cells[0] || cells[0].length !== width) {
      throw new Error('Failed to generate valid map cells');
    }

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

  private static generateCells(width: number, height: number, tilesByType: Record<TileClassification, string[]>, environmentType: EnvironmentType) {
    switch (environmentType) {
      case 'dungeon':
        return this.generateDungeonLayout(width, height, tilesByType);
      case 'nature':
        return this.generateNatureLayout(width, height, tilesByType);
      case 'city':
        return this.generateCityLayout(width, height, tilesByType);
      case 'abstract':
        return this.generateAbstractLayout(width, height, tilesByType);
      default:
        return this.generateBasicLayout(width, height, tilesByType);
    }
  }

  private static generateBasicLayout(width: number, height: number, tilesByType: Record<TileClassification, string[]>): MapCell[][] {
    const cells: MapCell[][] = [];
    
    for (let y = 0; y < height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < width; x++) {
        let tileId = null;
        let layer: 'floor' | 'wall' | 'decoration' = 'floor';

        // Simple map generation logic
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          // Border walls
          tileId = this.getRandomTile(tilesByType.wall);
          layer = 'wall';
        } else if (Math.random() < 0.1) {
          // Random decorations
          tileId = this.getRandomTile(tilesByType.decoration);
          layer = 'decoration';
        } else {
          // Floor tiles
          tileId = this.getRandomTile(tilesByType.floor);
          layer = 'floor';
        }

        row.push({ x, y, tileId, layer });
      }
      cells.push(row);
    }

    return cells;
  }

  private static generateDungeonLayout(width: number, height: number, tilesByType: Record<TileClassification, string[]>): MapCell[][] {
    const cells: MapCell[][] = [];
    
    // Initialize with walls
    for (let y = 0; y < height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ x, y, tileId: this.getRandomTile(tilesByType.wall), layer: 'wall' });
      }
      cells.push(row);
    }

    // Create rooms
    const roomCount = Math.floor((width * height) / 100) + 2;
    const rooms: { x: number, y: number, width: number, height: number }[] = [];

    for (let i = 0; i < roomCount; i++) {
      const roomWidth = Math.floor(Math.random() * 6) + 4;
      const roomHeight = Math.floor(Math.random() * 6) + 4;
      const roomX = Math.floor(Math.random() * (width - roomWidth - 2)) + 1;
      const roomY = Math.floor(Math.random() * (height - roomHeight - 2)) + 1;

      // Create room floor
      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            cells[y][x] = { x, y, tileId: this.getRandomTile(tilesByType.floor), layer: 'floor' };
          }
        }
      }

      rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
      const prevRoom = rooms[i - 1];
      const currentRoom = rooms[i];
      
      const prevCenterX = Math.floor(prevRoom.x + prevRoom.width / 2);
      const prevCenterY = Math.floor(prevRoom.y + prevRoom.height / 2);
      const currentCenterX = Math.floor(currentRoom.x + currentRoom.width / 2);
      const currentCenterY = Math.floor(currentRoom.y + currentRoom.height / 2);

      // Horizontal corridor
      const minX = Math.min(prevCenterX, currentCenterX);
      const maxX = Math.max(prevCenterX, currentCenterX);
      for (let x = minX; x <= maxX; x++) {
        if (x >= 0 && x < width && prevCenterY >= 0 && prevCenterY < height) {
          cells[prevCenterY][x] = { x, y: prevCenterY, tileId: this.getRandomTile(tilesByType.floor), layer: 'floor' };
        }
      }

      // Vertical corridor
      const minY = Math.min(prevCenterY, currentCenterY);
      const maxY = Math.max(prevCenterY, currentCenterY);
      for (let y = minY; y <= maxY; y++) {
        if (currentCenterX >= 0 && currentCenterX < width && y >= 0 && y < height) {
          cells[y][currentCenterX] = { x: currentCenterX, y, tileId: this.getRandomTile(tilesByType.floor), layer: 'floor' };
        }
      }
    }

    // Add decorations in rooms
    rooms.forEach(room => {
      if (Math.random() < 0.7) {
        const decorX = room.x + Math.floor(Math.random() * (room.width - 2)) + 1;
        const decorY = room.y + Math.floor(Math.random() * (room.height - 2)) + 1;
        if (decorX >= 0 && decorX < width && decorY >= 0 && decorY < height && cells[decorY] && cells[decorY][decorX] && cells[decorY][decorX].layer === 'floor') {
          cells[decorY][decorX] = { x: decorX, y: decorY, tileId: this.getRandomTile(tilesByType.decoration), layer: 'decoration' };
        }
      }
    });

    return cells;
  }

  private static generateNatureLayout(width: number, height: number, tilesByType: Record<TileClassification, string[]>): MapCell[][] {
    const cells: MapCell[][] = [];
    
    for (let y = 0; y < height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < width; x++) {
        let tileId = null;
        let layer: 'floor' | 'wall' | 'decoration' = 'floor';

        // Create organic patterns
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.05) * Math.cos(y * 0.05);
        
        if (noise > 0.5) {
          // Walls for trees/rocks
          tileId = this.getRandomTile(tilesByType.wall);
          layer = 'wall';
        } else if (noise > 0.2 && Math.random() < 0.3) {
          // Decorations for bushes/flowers
          tileId = this.getRandomTile(tilesByType.decoration);
          layer = 'decoration';
        } else {
          // Grass/ground
          tileId = this.getRandomTile(tilesByType.floor);
          layer = 'floor';
        }

        row.push({ x, y, tileId, layer });
      }
      cells.push(row);
    }

    return cells;
  }

  private static generateCityLayout(width: number, height: number, tilesByType: Record<TileClassification, string[]>): MapCell[][] {
    const cells: MapCell[][] = [];
    
    // Initialize with floor (streets)
    for (let y = 0; y < height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ x, y, tileId: this.getRandomTile(tilesByType.floor), layer: 'floor' });
      }
      cells.push(row);
    }

    // Create building blocks
    const blockSize = 6;
    for (let by = 0; by < height; by += blockSize + 2) {
      for (let bx = 0; bx < width; bx += blockSize + 2) {
        // Create building
        for (let y = by; y < Math.min(by + blockSize, height); y++) {
          for (let x = bx; x < Math.min(bx + blockSize, width); x++) {
            if (x === bx || x === bx + blockSize - 1 || y === by || y === by + blockSize - 1) {
              // Building walls
              cells[y][x] = { x, y, tileId: this.getRandomTile(tilesByType.wall), layer: 'wall' };
            } else if (Math.random() < 0.2) {
              // Interior decorations
              cells[y][x] = { x, y, tileId: this.getRandomTile(tilesByType.decoration), layer: 'decoration' };
            }
          }
        }
      }
    }

    return cells;
  }

  private static generateAbstractLayout(width: number, height: number, tilesByType: Record<TileClassification, string[]>): MapCell[][] {
    const cells: MapCell[][] = [];
    
    for (let y = 0; y < height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < width; x++) {
        let tileId = null;
        let layer: 'floor' | 'wall' | 'decoration' = 'floor';

        // Create abstract patterns using mathematical functions
        const pattern1 = Math.sin(x * 0.2) * Math.cos(y * 0.2);
        const pattern2 = Math.sin((x + y) * 0.15);
        const combined = pattern1 + pattern2;

        if (combined > 1) {
          tileId = this.getRandomTile(tilesByType.wall);
          layer = 'wall';
        } else if (combined > 0) {
          tileId = this.getRandomTile(tilesByType.decoration);
          layer = 'decoration';
        } else {
          tileId = this.getRandomTile(tilesByType.floor);
          layer = 'floor';
        }

        row.push({ x, y, tileId, layer });
      }
      cells.push(row);
    }

    return cells;
  }

  private static getRandomTile(tiles: string[]): string | null {
    if (!tiles || tiles.length === 0) {
      return null;
    }
    return tiles[Math.floor(Math.random() * tiles.length)];
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Map Generator API',
    endpoints: ['/extract-tiles', '/generate-map', '/atlas/:id', '/map/:id']
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
  
  // Check if atlas exists
  const atlas = atlases.get(validatedData.atlasId);
  if (!atlas) {
    throw createError('Atlas not found', 404);
  }
  
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
  res.status(err.status || 500).json(createResponse(false, undefined, err.message || 'Internal server error'));
});

// Function to find available port
const findAvailablePort = (startPort: number): Promise<number> => {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address()?.port || startPort;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Start server
const startServer = async () => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8890;
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0);
    });
  });
};

startServer().catch(console.error);

export default app;