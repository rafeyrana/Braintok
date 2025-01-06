import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import jwt from 'jsonwebtoken';
import logger from '../../utils/logger';

export const socketAuth = (
  socket: Socket,
  next: (err?: ExtendedError | undefined) => void
) => {
  try {
    const authHeader = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!authHeader) {
      logger.error('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const token = authHeader.split(' ')[1] || authHeader;

    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        throw new Error('Invalid token structure');
      }

      // Verify the token with Supabase JWT secret
      const verified = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
      if (typeof verified === 'object' && verified.sub) {
       
        (socket as any).userId = verified.sub;
        logger.info(`Socket authenticated for user: ${verified.sub}`);
        next();
      } else {
        throw new Error('Invalid token payload');
      }
    } catch (verifyError: any) {
      logger.error('Token verification failed:', verifyError);
      return next(new Error(`Authentication error: ${verifyError.message}`));
    }
  } catch (error: any) {
    logger.error('Socket authentication failed:', error);
    next(new Error('Authentication error'));
  }
}; 