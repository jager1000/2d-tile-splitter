"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.asyncHandler = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map