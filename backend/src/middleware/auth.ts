import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token is required' });
    }
    const secret = process.env.SUPABASE_JWT_SECRET;
    try {
      const decoded = jwt.decode(token, { complete: true });
      const verified = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
      next();
    } catch (verifyError: any) {
      return res.status(401).json({ error: 'Invalid token', details: verifyError.message });
    }
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};