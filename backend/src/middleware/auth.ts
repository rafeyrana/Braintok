import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    // Verify the token using Supabase JWT secret
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
    );

    // If verification passes, proceed to the next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};