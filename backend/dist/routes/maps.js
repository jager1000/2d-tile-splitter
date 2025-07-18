"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapRoutes = void 0;
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../constants");
const MapGenerationService_1 = require("../services/MapGenerationService");
const router = express_1.default.Router();
exports.mapRoutes = router;
router.get('/test', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Map service is working correctly',
        data: {
            mapSizeRange: {
                min: constants_1.APP_CONFIG.MIN_MAP_SIZE,
                max: constants_1.APP_CONFIG.MAX_MAP_SIZE,
            },
            supportedEnvironments: Object.values(constants_1.ENVIRONMENT_TYPES),
        },
    });
}));
const generateMapSchema = joi_1.default.object({
    width: joi_1.default.number().integer().min(constants_1.APP_CONFIG.MIN_MAP_SIZE).max(constants_1.APP_CONFIG.MAX_MAP_SIZE).required(),
    height: joi_1.default.number().integer().min(constants_1.APP_CONFIG.MIN_MAP_SIZE).max(constants_1.APP_CONFIG.MAX_MAP_SIZE).required(),
    tileSize: joi_1.default.number().integer().min(constants_1.APP_CONFIG.MIN_TILE_SIZE).max(constants_1.APP_CONFIG.MAX_TILE_SIZE).required(),
    environmentType: joi_1.default.string().valid('auto', 'nature', 'dungeon', 'city', 'abstract').required(),
    atlasId: joi_1.default.string().required(),
    enabledLayers: joi_1.default.object({
        floors: joi_1.default.boolean().required(),
        walls: joi_1.default.boolean().required(),
        decorations: joi_1.default.boolean().required(),
    }).required(),
    seed: joi_1.default.number().integer().optional(),
});
router.post('/generate', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validation = generateMapSchema.validate(req.body);
    if (validation.error) {
        throw (0, errorHandler_1.createError)(`Validation error: ${validation.error.message}`, 400);
    }
    const params = req.body;
    try {
        const generatedMap = MapGenerationService_1.MapGenerationService.generateMap(params);
        res.json({
            success: true,
            data: generatedMap,
            message: `Successfully generated ${params.width}x${params.height} map`,
        });
    }
    catch (error) {
        console.error('Map generation error:', error);
        throw (0, errorHandler_1.createError)(error instanceof Error ? error.message : constants_1.ERROR_MESSAGES.GENERATION_FAILED, 500);
    }
}));
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw (0, errorHandler_1.createError)('Map ID is required', 400);
    }
    throw (0, errorHandler_1.createError)(constants_1.ERROR_MESSAGES.MAP_NOT_FOUND, 404);
}));
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        data: [],
        message: 'Maps retrieved successfully',
    });
}));
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, width, height, cells, environmentType, atlasId } = req.body;
    if (!name || !width || !height || !cells || !environmentType || !atlasId) {
        throw (0, errorHandler_1.createError)('Missing required map data', 400);
    }
    res.json({
        success: true,
        message: 'Map saved successfully',
    });
}));
//# sourceMappingURL=maps.js.map