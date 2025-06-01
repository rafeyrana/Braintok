import { Request, Response, NextFunction } from 'express'; // Import NextFunction
import { z } from 'zod'; // Import Zod
import { WaitlistModel } from '../models/waitlist.model';
import { WaitlistEntry } from '../types/waitlist.types';
import { logInfo, logError } from '../utils/logger'; // Import logger

// Zod Schema for WaitlistEntry (for request body validation)
// 'id' is omitted as it's server-generated.
const waitlistEntrySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(1, { message: "Name cannot be empty" }),
  position: z.string().min(1, { message: "Position cannot be empty" }),
  use_case: z.string().min(1, { message: "Use case cannot be empty" }),
});

export const WaitlistController = {
  async submitEntry(req: Request, res: Response, next: NextFunction) { // Add NextFunction
    try {
      const validationResult = waitlistEntrySchema.safeParse(req.body);

      if (!validationResult.success) {
        logError('Invalid request body for submitEntry', undefined, { errors: validationResult.error.flatten(), body: req.body });
        return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.flatten() });
      }

      const entryData: Omit<WaitlistEntry, 'id'> = validationResult.data; // Use validated data

      // Pass only the validated data, WaitlistModel.createEntry will handle creation (including ID)
      const result = await WaitlistModel.createEntry(entryData);
      logInfo('Waitlist entry submitted successfully', { email: entryData.email });
      res.status(201).json(result);
    } catch (error) {
      logError('Error submitting waitlist entry', error as Error, { body: req.body });
      // next(error); // Option to pass to global error handler
      res.status(500).json({ error: 'Failed to submit waitlist entry' });
    }
  },

  async getAllEntries(req: Request, res: Response, next: NextFunction) { // Add NextFunction
    try {
      const entries = await WaitlistModel.getAllEntries();
      logInfo('Fetched all waitlist entries', { count: entries.length });
      res.status(200).json(entries);
    } catch (error) {
      logError('Error fetching waitlist entries', error as Error);
      // next(error); // Option to pass to global error handler
      res.status(500).json({ error: 'Failed to fetch waitlist entries' });
    }
  }
};
