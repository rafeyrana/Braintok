import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'; // S3Client is imported from lib
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logInfo, logError, logDebug, logWarn } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import s3Client, { bucketName as s3BucketName } from '../lib/s3Client'; // Import centralized client and bucket name

class S3Service {
  constructor() {
    // Constructor is simplified as S3 client and bucket name are imported.
    // Initialization logging is now in s3Client.ts.
  }

  // Getters for s3Client and bucketName can be removed if they just return imported values.
  // For now, let's assume direct usage of imported s3Client and s3BucketName.

  async generatePresignedUrl(
    email: string,
    filename: string,
    fileType: string
  ): Promise<{ presignedUrl: string; s3Key: string }> {
    try {
      if (!email || !filename || !fileType) {
        throw new Error('Missing required parameters for presigned URL generation');
      }

      // Generate a unique key for the file
      const timestamp = new Date().getTime();
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Key = `${sanitizedEmail}/${timestamp}_${sanitizedFilename}`;

      logDebug('Generating presigned URL', { email, filename, fileType, s3Key });

      const command = new PutObjectCommand({
        Bucket: s3BucketName, // Use imported bucketName
        Key: s3Key,
        ContentType: fileType,
        ACL: 'private'
      });

      // Generate presigned URL with longer expiration
      const presignedUrl = await getSignedUrl(s3Client, command, { // Use imported s3Client
        expiresIn: 3600,
      });

      logInfo('Generated presigned URL successfully', { email, filename, s3Key });

      return {
        presignedUrl,
        s3Key,
      };
    } catch (error) {
      logError('Error generating presigned URL', error as Error, { email, filename, fileType });
      throw new Error('Failed to generate presigned URL');
    }
  }
  

  async verifyFileUpload(s3Key: string): Promise<boolean> {
    try {
      logDebug('Verifying file upload', { s3Key });

      const command = new HeadObjectCommand({
        Bucket: s3BucketName, // Use imported bucketName
        Key: s3Key,
      });

      await s3Client.send(command); // Use imported s3Client
      
      logInfo('File upload verified successfully', { s3Key });
      return true;
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        logWarn('File not found during verification', { s3Key });
        return false;
      }
      logError('Error verifying file upload', error as Error, { s3Key });
      throw error;
    }
  }

  async deleteFile(s3Key: string): Promise<void> {
    try {
      logDebug('Deleting file', { s3Key });

      const command = new DeleteObjectCommand({
        Bucket: s3BucketName, // Use imported bucketName
        Key: s3Key
      });

      await s3Client.send(command); // Use imported s3Client
      
      logInfo('File deleted successfully', { s3Key });
    } catch (error) {
      logError('Error deleting file', error as Error, { s3Key });
      throw error;
    }
  }

  async getObjectContent(s3Key: string): Promise<Buffer> {
    try {
      logDebug('Fetching object content from S3', { s3Key });

      const command = new GetObjectCommand({
        Bucket: s3BucketName, // Use imported bucketName
        Key: s3Key,
      });

      const response = await s3Client.send(command); // Use imported s3Client
      
      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      // Convert the readable stream to a buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      logInfo('Successfully fetched object content from S3', { 
        s3Key, 
        contentLength: buffer.length 
      });

      return buffer;
    } catch (error) {
      logError('Error fetching object content from S3', error as Error, { s3Key });
      throw new Error('Failed to fetch object content from S3');
    }
  }

  async generatePresignedGetUrl(s3Key: string): Promise<string> {
    try {
      logDebug('Generating presigned GET URL', { s3Key });
      const command = new GetObjectCommand({
        Bucket: s3BucketName, // Use imported bucketName
        Key: s3Key,
      });
      const presignedUrl = await getSignedUrl(s3Client, command, { // Use imported s3Client
        expiresIn: 300, // 5 minutes
      });
      logInfo('Generated presigned GET URL successfully', { s3Key });
      return presignedUrl;
    } catch (error) {
      logError('Error generating presigned GET URL', error as Error, { s3Key });
      throw new Error('Failed to generate presigned GET URL');
    }
  }
}

export const s3Service = new S3Service();
