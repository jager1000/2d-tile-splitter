import express from 'express';
import multer from 'multer';
import joi from 'joi';
import { TileExtractionService } from '../services/TileExtractionService';
import { MapGenerationService } from '../services/MapGenerationService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { APP_CONFIG, ERROR_MESSAGES } from '../constants';
import type { Request, Response } from 'express';
import type { APIResponse, TileAtlas, AtlasGridConfig } from '../types';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: APP_CONFIG.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if ((APP_CONFIG.SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(createError(ERROR_MESSAGES.INVALID_FILE_TYPE, 400));
    }
  },
});

// Validation schemas
const extractTilesSchema = joi.object({
  gridConfig: joi.object({
    type: joi.string().valid('auto', 'preset', 'custom').required(),
    cols: joi.number().integer().min(1).max(32).optional(),
    rows: joi.number().integer().min(1).max(32).optional(),
  }).required(),
  tileSize: joi.number().integer().min(APP_CONFIG.MIN_TILE_SIZE).max(APP_CONFIG.MAX_TILE_SIZE).required(),
});

interface ExtractTilesRequest extends Request {
  body: {
    gridConfig: string;
    tileSize: string;
  };
  file?: Express.Multer.File | undefined;
}

/**
 * @swagger
 * /api/tiles/extract:
 *   post:
 *     summary: Extract tiles from image atlas
 *     description: Extract tiles from an uploaded image atlas based on grid configuration
 *     tags:
 *       - Tiles
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - gridConfig
 *               - tileSize
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image atlas file
 *               gridConfig:
 *                 type: string
 *                 description: JSON string with grid configuration
 *               tileSize:
 *                 type: string
 *                 description: Size of each tile in pixels
 *     responses:
 *       200:
 *         description: Tiles extracted successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Extraction failed
 */
router.post(
  '/extract',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response<APIResponse<TileAtlas>>) => {
    const extractReq = req as ExtractTilesRequest;
    
    if (!extractReq.file) {
      throw createError('No image file uploaded', 400);
    }

    // Parse and validate request data
    let gridConfig: AtlasGridConfig;
    let tileSize: number;

    try {
      gridConfig = JSON.parse(extractReq.body.gridConfig);
      tileSize = parseInt(extractReq.body.tileSize, 10);
    } catch (error) {
      throw createError('Invalid request data format', 400);
    }

    // Validate the parsed data
    const validation = extractTilesSchema.validate({ gridConfig, tileSize });
    if (validation.error) {
      throw createError(`Validation error: ${validation.error.message}`, 400);
    }

    try {
      const atlas = await TileExtractionService.extractTiles(
        extractReq.file.buffer,
        gridConfig,
        tileSize,
        extractReq.file.originalname
      );

      // Store the atlas for later use in map generation
      MapGenerationService.storeAtlas(atlas);

      res.json({
        success: true,
        data: atlas,
        message: `Successfully extracted ${atlas.tiles.length} tiles`,
      });
    } catch (error) {
      console.error('Tile extraction error:', error);
      throw createError(ERROR_MESSAGES.EXTRACTION_FAILED, 500);
    }
  })
);

/**
 * @swagger
 * /api/tiles/classify:
 *   post:
 *     summary: Classify tiles
 *     description: Classify tiles using AI analysis
 *     tags:
 *       - Tiles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - atlasId
 *             properties:
 *               atlasId:
 *                 type: string
 *                 description: ID of the atlas to classify
 *     responses:
 *       200:
 *         description: Tiles classified successfully
 *       400:
 *         description: Invalid atlas ID
 *       500:
 *         description: Classification failed
 */
router.post(
  '/classify',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    const { atlasId } = req.body;

    if (!atlasId) {
      throw createError('Atlas ID is required', 400);
    }

    // For now, return mock classifications since we'd need a database
    // In a real implementation, you'd fetch the atlas and classify its tiles
    res.json({
      success: true,
      data: [],
      message: 'Tile classification completed',
    });
  })
);

/**
 * @swagger
 * /api/tiles/{id}/classification:
 *   patch:
 *     summary: Update tile classification
 *     description: Update a tile's classification manually
 *     tags:
 *       - Tiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classification
 *             properties:
 *               classification:
 *                 type: string
 *                 enum: [floor, wall, decoration]
 *                 description: The new classification type
 *     responses:
 *       200:
 *         description: Tile classification updated successfully
 *       400:
 *         description: Invalid tile ID or classification
 *       404:
 *         description: Tile not found
 */
router.patch(
  '/:id/classification',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    const { id } = req.params;
    const { classification } = req.body;

    if (!id || !classification) {
      throw createError('Tile ID and classification are required', 400);
    }

    if (!['floor', 'wall', 'decoration'].includes(classification)) {
      throw createError('Invalid classification type', 400);
    }

    // In a real implementation, you'd update the tile in the database
    res.json({
      success: true,
      message: 'Tile classification updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/tiles/test:
 *   get:
 *     summary: Test tiles service
 *     description: Test endpoint to verify tiles API is working
 *     tags:
 *       - Tiles
 *     responses:
 *       200:
 *         description: Tiles service is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     supportedFormats:
 *                       type: array
 *                     maxFileSize:
 *                       type: number
 *                     tileSizeRange:
 *                       type: object
 */
router.get(
  '/test',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    res.json({
      success: true,
      message: 'Tile service is working correctly',
      data: {
        supportedFormats: APP_CONFIG.SUPPORTED_IMAGE_TYPES,
        maxFileSize: APP_CONFIG.MAX_FILE_SIZE,
        tileSizeRange: {
          min: APP_CONFIG.MIN_TILE_SIZE,
          max: APP_CONFIG.MAX_TILE_SIZE,
        },
      },
    });
  })
);

export { router as tileRoutes };
