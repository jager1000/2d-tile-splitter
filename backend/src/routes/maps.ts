import express from 'express';
import joi from 'joi';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { APP_CONFIG, ERROR_MESSAGES, ENVIRONMENT_TYPES } from '../constants';
import { MapGenerationService } from '../services/MapGenerationService';
import type { Request, Response } from 'express';
import type { APIResponse, GeneratedMap, MapGenerationParams } from '../types';

const router = express.Router();

/**
 * @swagger
 * /api/maps/test:
 *   get:
 *     summary: Test maps service
 *     description: Test endpoint to verify maps API is working
 *     tags:
 *       - Maps
 *     responses:
 *       200:
 *         description: Maps service is working
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
 *                     mapSizeRange:
 *                       type: object
 *                     supportedEnvironments:
 *                       type: array
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
        supportedEnvironments: Object.values(ENVIRONMENT_TYPES),
      },
    });
  })
);

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
 * @swagger
 * /api/maps/generate:
 *   post:
 *     summary: Generate a new map
 *     description: Generate a new map based on parameters
 *     tags:
 *       - Maps
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - width
 *               - height
 *               - tileSize
 *               - environmentType
 *               - atlasId
 *               - enabledLayers
 *             properties:
 *               width:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 128
 *                 description: Width of the map in tiles
 *               height:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 128
 *                 description: Height of the map in tiles
 *               tileSize:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 128
 *                 description: Size of each tile in pixels
 *               environmentType:
 *                 type: string
 *                 enum: [auto, nature, dungeon, city, abstract]
 *                 description: Type of environment to generate
 *               atlasId:
 *                 type: string
 *                 description: ID of the tile atlas to use
 *               enabledLayers:
 *                 type: object
 *                 properties:
 *                   floors:
 *                     type: boolean
 *                     description: Enable floor tiles
 *                   walls:
 *                     type: boolean
 *                     description: Enable wall tiles
 *                   decorations:
 *                     type: boolean
 *                     description: Enable decoration tiles
 *               seed:
 *                 type: integer
 *                 description: Optional seed for random generation
 *     responses:
 *       200:
 *         description: Successfully generated map
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
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
      // Use the MapGenerationService to generate a proper map
      const generatedMap = MapGenerationService.generateMap(params);

      res.json({
        success: true,
        data: generatedMap,
        message: `Successfully generated ${params.width}x${params.height} map`,
      });
    } catch (error) {
      console.error('Map generation error:', error);
      throw createError(error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED, 500);
    }
  })
);

/**
 * @swagger
 * /api/maps/{id}:
 *   get:
 *     summary: Get map by ID
 *     description: Retrieve a specific map by its ID
 *     tags:
 *       - Maps
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The map ID
 *     responses:
 *       200:
 *         description: Map retrieved successfully
 *       404:
 *         description: Map not found
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
 * @swagger
 * /api/maps:
 *   get:
 *     summary: List all maps
 *     description: Get a list of all available maps
 *     tags:
 *       - Maps
 *     responses:
 *       200:
 *         description: List of maps retrieved successfully
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
 * @swagger
 * /api/maps:
 *   post:
 *     summary: Save a map
 *     description: Save a map to the database
 *     tags:
 *       - Maps
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - width
 *               - height
 *               - cells
 *               - environmentType
 *               - atlasId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the map
 *               width:
 *                 type: integer
 *                 description: Width of the map in tiles
 *               height:
 *                 type: integer
 *                 description: Height of the map in tiles
 *               cells:
 *                 type: array
 *                 description: 2D array of map cells
 *               environmentType:
 *                 type: string
 *                 description: Type of environment
 *               atlasId:
 *                 type: string
 *                 description: ID of the tile atlas used
 *     responses:
 *       200:
 *         description: Map saved successfully
 *       400:
 *         description: Invalid map data
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

export { router as mapRoutes };
