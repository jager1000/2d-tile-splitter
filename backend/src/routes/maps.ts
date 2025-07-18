import express from 'express';
import joi from 'joi';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { APP_CONFIG, ERROR_MESSAGES } from '../constants';
import type { Request, Response } from 'express';
import type { APIResponse, GeneratedMap, MapGenerationParams } from '../types';

const router = express.Router();

// Validation schemas
const generateMapSchema = joi.object({
  width: joi.number().integer().min(APP_CONFIG.MIN_MAP_SIZE).max(APP_CONFIG.MAX_MAP_SIZE).required(),
  height: joi.number().integer().min(APP_CONFIG.MIN_MAP_SIZE).max(APP_CONFIG.MAX_MAP_SIZE).required(),
  tileSize: joi.number().integer().min(APP_CONFIG.MIN_TILE_SIZE).max(APP_CONFIG.MAX_TILE_SIZE).required(),
  environmentType: joi.string().valid('auto', 'nature', 'dungeon', 'city', 'abstract').required(),
  atlasId: joi.string().required(),
  enabledLayers: joi.object({
    floors: joi.boolean().required(),
    walls: joi.boolean().required(),
    decorations: joi.boolean().required(),
  }).required(),
  seed: joi.number().integer().optional(),
});

/**
 * POST /api/maps/generate
 * Generate a new map based on parameters
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response<APIResponse<GeneratedMap>>) => {
    const validation = generateMapSchema.validate(req.body);
    if (validation.error) {
      throw createError(`Validation error: ${validation.error.message}`, 400);
    }

    const params: MapGenerationParams = req.body;

    try {
      // Mock map generation for now
      // In a real implementation, you'd use the MapGenerationService
      const mockMap: GeneratedMap = {
        id: `map-${Date.now()}`,
        name: `Generated Map ${new Date().toLocaleTimeString()}`,
        width: params.width,
        height: params.height,
        tileSize: params.tileSize,
        cells: Array(params.height).fill(null).map((_, y) =>
          Array(params.width).fill(null).map((_, x) => ({
            x,
            y,
            tileId: null,
            layer: 'floor' as const,
          }))
        ),
        environmentType: params.environmentType,
        atlasId: params.atlasId,
        createdAt: new Date(),
      };

      res.json({
        success: true,
        data: mockMap,
        message: `Successfully generated ${params.width}x${params.height} map`,
      });
    } catch (error) {
      console.error('Map generation error:', error);
      throw createError(ERROR_MESSAGES.GENERATION_FAILED, 500);
    }
  })
);

/**
 * GET /api/maps/:id
 * Get a specific map by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    const { id } = req.params;

    if (!id) {
      throw createError('Map ID is required', 400);
    }

    // In a real implementation, you'd fetch from database
    throw createError(ERROR_MESSAGES.MAP_NOT_FOUND, 404);
  })
);

/**
 * GET /api/maps
 * List all maps
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    // In a real implementation, you'd fetch from database
    res.json({
      success: true,
      data: [],
      message: 'Maps retrieved successfully',
    });
  })
);

/**
 * POST /api/maps
 * Save a map
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    const { name, width, height, cells, environmentType, atlasId } = req.body;

    if (!name || !width || !height || !cells || !environmentType || !atlasId) {
      throw createError('Missing required map data', 400);
    }

    // In a real implementation, you'd save to database
    res.json({
      success: true,
      message: 'Map saved successfully',
    });
  })
);

/**
 * GET /api/maps/test
 * Test endpoint to verify API is working
 */
router.get(
  '/test',
  asyncHandler(async (req: Request, res: Response<APIResponse>) => {
    res.json({
      success: true,
      message: 'Map service is working correctly',
      data: {
        mapSizeRange: {
          min: APP_CONFIG.MIN_MAP_SIZE,
          max: APP_CONFIG.MAX_MAP_SIZE,
        },
        supportedEnvironments: ['auto', 'nature', 'dungeon', 'city', 'abstract'],
      },
    });
  })
);

export { router as mapRoutes };
