import { Request, Response } from 'express';
import { s3Service } from '../services/s3Service';
import { documentService } from '../services/documentService';
import { RequestUploadDTO, UploadCompletionDTO } from '../types/documents';
import { logInfo, logError, logDebug } from '../utils/logger';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface Document {
  name : string,
  uploadOn: Date,
  s3Key: string
}
export class DocumentController {
  constructor() {
    // Bind methods to ensure correct 'this' context
    this.requestUpload = this.requestUpload.bind(this);
    this.confirmUpload = this.confirmUpload.bind(this);
    this.getDocuments = this.getDocuments.bind(this);
    this.getDocumentAccessLinkByS3Key = this.getDocumentAccessLinkByS3Key.bind(this);
  }

  async requestUpload(req: any, res: any) {
    try {
      logInfo('Requesting upload', { body: req.body });
      const { files, email } = req.body;

      if (!files || files.length === 0) {
        logError('No files specified', undefined, { body: req.body });
        return res.status(400).json({ error: 'No files specified' });
      }

      if (!email) {
        logError('Email is required', undefined, { body: req.body });
        return res.status(400).json({ error: 'Email is required' });
      }

      const uploads = await Promise.all(
        files.map(async (file: any) => {
          logInfo('Generating presigned URL', { email, fileName: file.filename, fileType: file.fileType });
          // Generate presigned URL
          const { presignedUrl, s3Key } = await s3Service.generatePresignedUrl(
            email,
            file.filename,
            file.fileType
          );

          logInfo('Generated presigned URL successfully', { email, fileName: file.filename });

          // Create pending document record
          const documentId = await documentService.createPendingDocument(
            email,
            file.filename,
            s3Key,
            file.size,
            file.fileType
          );

          return {
            documentId,
            presignedUrl,
            s3Key,
          };
        })
      );

      logInfo('Upload request processed successfully', { body: req.body });
      res.json({ uploads });
    } catch (error: any) {
      logError('Error in requestUpload', error, { body: req.body });
      res.status(500).json({ error: 'Failed to process upload request' });
    }
  }

  async confirmUpload(req: any, res: any) {
    try {
      logInfo('Confirming upload', { body: req.body });
      const completion = req.body;

      if (!completion.email) {
        logError('Email is required', undefined, { body: req.body });
        return res.status(400).json({ error: 'Email is required' });
      }

      if (!completion.documents || completion.documents.length === 0) {
        logError('No documents specified', undefined, { body: req.body });
        return res.status(400).json({ error: 'No documents specified' });
      }

      // Verify each file exists in S3
      for (const doc of completion.documents) {
        logInfo('Verifying file upload', { email: completion.email, fileName: doc.fileName });
        const exists = await s3Service.verifyFileUpload(doc.s3Key);
        if (!exists && doc.status === 'success') {
          doc.status = 'failed';
          doc.error = 'File not found in S3';
          logError('File not found during upload confirmation', undefined, { email: completion.email, fileName: doc.fileName });
        }
      }

      logInfo('Upload verification completed', { body: req.body });

      // Update document statuses in database
      await documentService.processUploadCompletion(completion);

      logInfo('Upload completion processed successfully', { body: req.body });
      res.json({ message: 'Upload completion processed successfully' });
    } catch (error: any) {
      logError('Error in confirmUpload', error, { body: req.body });
      res.status(500).json({ error: 'Failed to process upload completion' });
    }
  }

  
  async getDocuments(req: any, res: any) {
    try {
      logInfo('Fetching documents', { query: req.query });
      const email = req.query.email as string;

      if (!email) {
        logError('Email is required', undefined, { query: req.query });
        return res.status(400).json({ error: 'Email is required' });
      }

      const apiDocuments = await documentService.getDocumentsByEmail(email);
    

    logInfo('Documents fetched successfully', { email, count: apiDocuments.length });
    res.json(apiDocuments);
    } catch (error: any) {
      logError('Error in getDocuments', error, { query: req.query });
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  async getDocumentAccessLinkByS3Key(req: any, res: any) {
    try {
      const { s3Key } = req.query;
      console.log('s3Key', s3Key);
      if (!s3Key || typeof s3Key !== 'string') {
        return res.status(400).json({ error: 'Valid s3Key is required' });
      }

      const command = new GetObjectCommand({
        Bucket: s3Service.bucketName,
        Key: s3Key
      });
      console.log('command', command);

      const presignedUrl = await getSignedUrl(s3Service.s3Client, command, {
        expiresIn: 300 // 5 minutes in seconds
      });
      console.log('presignedUrl', presignedUrl);
      logInfo('Generated document access link', { s3Key });
      res.json({ presignedUrl });
      
    } catch (error) {
      logError('Error generating document access link', error as Error, { s3Key: req.query.s3Key });
      res.status(500).json({ error: 'Failed to generate document access link' });
    }
  }

  async deleteDocumentByS3Key(req: any, res: any){
    try{
      let s3Key = req.query.s3Key;
      let email = req.query.email;
      if (!s3Key || typeof s3Key !== 'string') {
        console.log('s3Key is required when deleting');
        return res.status(400).json({ error: 'Valid s3Key is required' });
      }
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      await s3Service.deleteFile(s3Key);
      await documentService.deleteDocumentByS3Key(email, s3Key);
      logInfo('Document deleted successfully', { s3Key });
      console.log('Document deleted successfully', s3Key, email);
      res.json({ message: 'Document deleted successfully' });

    } catch (error: any) {
      logError('Error in deleteDocumentByS3Key', error, { query: req.query });
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
}

export const documentController = new DocumentController();
