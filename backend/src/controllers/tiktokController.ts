import { Request, Response } from 'express';
import { logInfo, logError } from '../utils/logger';

export class TiktokController {
    constructor() {
        this.buildTiktok = this.buildTiktok.bind(this);
    }
    
    async buildTiktok(req: Request, res: Response) {
        try {
            logInfo('Tiktok build request received');
            res.json({ message: 'Tiktok build request received' });
        } catch (error) {
            logError('Error building tiktok', error as Error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export const tiktokController = new TiktokController();