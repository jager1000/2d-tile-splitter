import type { Request, Response, NextFunction } from 'express';
import type { APIResponse } from '../types';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (err: AppError, req: Request, res: Response<APIResponse>, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: (message: string, statusCode?: number) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map