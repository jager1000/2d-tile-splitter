"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tileRoutes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const joi_1 = __importDefault(require("joi"));
const TileExtractionService_1 = require("../services/TileExtractionService");
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../constants");
const router = express_1.default.Router();
exports.tileRoutes = router;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: constants_1.APP_CONFIG.MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        if (constants_1.APP_CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb((0, errorHandler_1.createError)(constants_1.ERROR_MESSAGES.INVALID_FILE_TYPE, 400));
        }
    },
});
const extractTilesSchema = joi_1.default.object({
    gridConfig: joi_1.default.object({
        type: joi_1.default.string().valid('auto', 'preset', 'custom').required(),
        cols: joi_1.default.number().integer().min(1).max(32).optional(),
        rows: joi_1.default.number().integer().min(1).max(32).optional(),
    }).required(),
    tileSize: joi_1.default.number().integer().min(constants_1.APP_CONFIG.MIN_TILE_SIZE).max(constants_1.APP_CONFIG.MAX_TILE_SIZE).required(),
});
router.post('/extract', upload.single('image'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const extractReq = req;
    if (!extractReq.file) {
        throw (0, errorHandler_1.createError)('No image file uploaded', 400);
    }
    let gridConfig;
    let tileSize;
    try {
        gridConfig = JSON.parse(extractReq.body.gridConfig);
        tileSize = parseInt(extractReq.body.tileSize, 10);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Invalid request data format', 400);
    }
    const validation = extractTilesSchema.validate({ gridConfig, tileSize });
    if (validation.error) {
        throw (0, errorHandler_1.createError)(`Validation error: ${validation.error.message}`, 400);
    }
    try {
        const atlas = await TileExtractionService_1.TileExtractionService.extractTiles(extractReq.file.buffer, gridConfig, tileSize, extractReq.file.originalname);
        res.json({
            success: true,
            data: atlas,
            message: `Successfully extracted ${atlas.tiles.length} tiles`,
        });
    }
    catch (error) {
        console.error('Tile extraction error:', error);
        throw (0, errorHandler_1.createError)(constants_1.ERROR_MESSAGES.EXTRACTION_FAILED, 500);
    }
}));
router.post('/classify', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { atlasId } = req.body;
    if (!atlasId) {
        throw (0, errorHandler_1.createError)('Atlas ID is required', 400);
    }
    res.json({
        success: true,
        data: [],
        message: 'Tile classification completed',
    });
}));
router.patch('/:id/classification', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { classification } = req.body;
    if (!id || !classification) {
        throw (0, errorHandler_1.createError)('Tile ID and classification are required', 400);
    }
    if (!['floor', 'wall', 'decoration'].includes(classification)) {
        throw (0, errorHandler_1.createError)('Invalid classification type', 400);
    }
    res.json({
        success: true,
        message: 'Tile classification updated successfully',
    });
}));
router.get('/test', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Tile service is working correctly',
        data: {
            supportedFormats: constants_1.APP_CONFIG.SUPPORTED_IMAGE_TYPES,
            maxFileSize: constants_1.APP_CONFIG.MAX_FILE_SIZE,
            tileSizeRange: {
                min: constants_1.APP_CONFIG.MIN_TILE_SIZE,
                max: constants_1.APP_CONFIG.MAX_TILE_SIZE,
            },
        },
    });
}));
//# sourceMappingURL=tiles.js.map