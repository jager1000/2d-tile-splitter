"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const constants_1 = require("./constants");
const tiles_1 = require("./routes/tiles");
const maps_1 = require("./routes/maps");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : ['http://localhost:3000'],
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)(constants_1.APP_CONFIG.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: constants_1.APP_CONFIG.NODE_ENV,
    });
});
app.use('/api/tiles', tiles_1.tileRoutes);
app.use('/api/maps', maps_1.mapRoutes);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});
app.use(errorHandler_1.errorHandler);
const PORT = constants_1.APP_CONFIG.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${constants_1.APP_CONFIG.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=server.js.map