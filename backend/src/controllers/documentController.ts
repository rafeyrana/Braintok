import { Request, Response, NextFunction } from 'express'; // Use correct Express types
import { z } from 'zod'; // Import Zod
import { s3Service } from '../services/s3Service';
import { documentService } from '../services/documentService';
// Assuming RequestUploadDTO and UploadCompletionDTO might be replaced or augmented by Zod schemas for validation
// For now, we'll define Zod schemas directly in the controller file for clarity,
// but they could be moved to `types/documents.zod.ts` or similar later.
import { logInfo, logError } from '../utils/logger';
import { Document as DocumentType } from '../types/documents'; // Rename imported Document to avoid conflict

// Zod Schemas for validation
const fileSchema = z.object({
  filename: z.string().min(1),
  fileType: z.string().min(1),
  size: z.number().positive(),
});

const requestUploadBodySchema = z.object({
  files: z.array(fileSchema).min(1),
  email: z.string().email(),
});

const documentCompletionSchema = z.object({
  documentId: z.string().uuid(),
  s3Key: z.string().min(1),
  fileName: z.string().min(1), // Added fileName for completeness from context
  status: z.enum(['success', 'failed']),
  error: z.string().optional(),
  metadata: z.object({ // Added metadata based on UploadCompletionDTO
    size: z.number().positive(),
    type: z.string().min(1),
    lastModified: z.string().min(1), // Consider z.dateString() if format is ISO, or transform
  })
});

const confirmUploadBodySchema = z.object({
  documents: z.array(documentCompletionSchema).min(1),
  email: z.string().email(),
});

const emailQuerySchema = z.object({
  email: z.string().email(),
});

const s3KeyQuerySchema = z.object({
  s3Key: z.string().min(1),
});

const deleteDocumentQuerySchema = z.object({
   s3Key: z.string().min(1),
   email: z.string().email(),
});

// Remove local Document interface as DocumentType from types/documents.ts is now used
// export interface Document {
//   name : string,
//   uploadOn: Date,
//   s3Key: string
// }

export class DocumentController {
  constructor() {
    this.requestUpload = this.requestUpload.bind(this);
    this.confirmUpload = this.confirmUpload.bind(this);
    this.getDocuments = this.getDocuments.bind(this);
    this.getDocumentAccessLinkByS3Key = this.getDocumentAccessLinkByS3Key.bind(this);
    this.deleteDocumentByS3Key = this.deleteDocumentByS3Key.bind(this); // Bind new method
  }

  async requestUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = requestUploadBodySchema.safeParse(req.body);
      if (!validationResult.success) {
        logError('Invalid request body for requestUpload', undefined, { errors: validationResult.error.flatten() });
        return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.flatten() });
      }
      const { files, email } = validationResult.data;

      logInfo('Requesting upload', { email, fileCount: files.length });

      const uploads = await Promise.all(
        files.map(async (file) => {
          logInfo('Generating presigned URL', { email, fileName: file.filename, fileType: file.fileType });
          const { presignedUrl, s3Key } = await s3Service.generatePresignedUrl(
            email,
            file.filename,
            file.fileType
          );
          logInfo('Generated presigned URL successfully', { email, fileName: file.filename });
          const documentId = await documentService.createPendingDocument(
            email,
            file.filename,
            s3Key,
            file.size,
            file.fileType
          );
          return { documentId, presignedUrl, s3Key };
        })
      );
      res.json({ uploads });
    } catch (error: any) {
      logError('Error in requestUpload', error, { body: req.body });
      next(error); // Pass to global error handler
    }
  }

  async confirmUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = confirmUploadBodySchema.safeParse(req.body);
      if (!validationResult.success) {
        logError('Invalid request body for confirmUpload', undefined, { errors: validationResult.error.flatten() });
        return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.flatten() });
      }
      // Use validated data (example, though 'completion' was used loosely before)
      const confirmedUploadData = validationResult.data;

      logInfo('Confirming upload', { email: confirmedUploadData.email, documentCount: confirmedUploadData.documents.length });

      for (const doc of confirmedUploadData.documents) {
        logInfo('Verifying file upload', { email: confirmedUploadData.email, fileName: doc.fileName });
        const exists = await s3Service.verifyFileUpload(doc.s3Key);
        if (!exists && doc.status === 'success') {
          doc.status = 'failed'; // Modify a copy if this data is used elsewhere, or ensure this is intended
          doc.error = 'File not found in S3';
          logError('File not found during upload confirmation', undefined, { email: confirmedUploadData.email, fileName: doc.fileName });
        }
      }
      logInfo('Upload verification completed for user', { email: confirmedUploadData.email });

      // documentService.processUploadCompletion likely expects a type similar to UploadCompletionDTO
      // We need to ensure confirmedUploadData matches this or adapt it.
      // For now, assuming it's compatible or will be adjusted in the service/repository layer.
      await documentService.processUploadCompletion(confirmedUploadData);

      res.json({ message: 'Upload completion processed successfully' });
    } catch (error: any) {
      logError('Error in confirmUpload', error, { body: req.body });
      next(error); // Pass to global error handler
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = emailQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        logError('Invalid query params for getDocuments', undefined, { errors: validationResult.error.flatten() });
        return res.status(400).json({ error: 'Invalid query parameters', details: validationResult.error.flatten() });
      }
      const { email } = validationResult.data;

      logInfo('Fetching documents', { email });
      const apiDocuments: DocumentType[] = await documentService.getDocumentsByEmail(email);
      logInfo('Documents fetched successfully', { email, count: apiDocuments.length });
      res.json(apiDocuments);
    } catch (error: any) {
      logError('Error in getDocuments', error, { query: req.query });
      next(error); // Pass to global error handler
    }
  }

  async getDocumentAccessLinkByS3Key(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = s3KeyQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        logError('Invalid query params for getDocumentAccessLinkByS3Key', undefined, { errors: validationResult.error.flatten() });
        return res.status(400).json({ error: 'Invalid query parameters', details: validationResult.error.flatten() });
      }
      const { s3Key } = validationResult.data;

      logInfo('Generating document access link', { s3Key });
      const presignedUrl = await s3Service.generatePresignedGetUrl(s3Key);
      res.json({ presignedUrl });
    } catch (error: any) {
      logError('Error generating document access link', error, { query: req.query });
      next(error); // Pass to global error handler
    }
  }

  async deleteDocumentByS3Key(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = deleteDocumentQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        logError('Invalid query params for deleteDocumentByS3Key', undefined, { errors: validationResult.error.flatten() });
        return res.status(400).json({ error: 'Invalid query parameters', details: validationResult.error.flatten() });
      }
      const { s3Key, email } = validationResult.data;

      logInfo('Deleting document', { s3Key, email });
      await s3Service.deleteFile(s3Key);
      await documentService.deleteDocumentByS3Key(email, s3Key);
      logInfo('Document deleted successfully', { s3Key, email });
      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      logError('Error in deleteDocumentByS3Key', error, { query: req.query });
      next(error); // Pass to global error handler
    }
  }
}

export const documentController = new DocumentController();
