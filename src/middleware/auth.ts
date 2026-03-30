import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
        requestId: req.headers['x-request-id'] ?? 'unknown',
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== config.apiSecretKey) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API token.',
        requestId: req.headers['x-request-id'] ?? 'unknown',
      },
    });
    return;
  }

  next();
}
