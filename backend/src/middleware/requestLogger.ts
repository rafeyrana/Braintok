import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  const startTime = Date.now();

  // Log request
  logger.info('Incoming Request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      host: req.get('host')
    },
    ip: req.ip
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Response Sent', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  // Log errors
  res.on('error', (error) => {
    logger.error('Response Error', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack
    });
  });

  next();
}; 