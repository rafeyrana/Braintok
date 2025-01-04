import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logInfo, logError, logDebug, logWarn } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

class S3Service {
  private readonly _s3Client: S3Client;
  private readonly _bucketName: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing required AWS configuration');
    }

    this._s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this._bucketName = bucketName;
    
    logInfo('S3Service initialized', { 
      region: process.env.AWS_REGION,
      bucket: this._bucketName 
    });
  }

  get bucketName() {
    return this._bucketName;
  }

  get s3Client() {
    return this._s3Client;
  }

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
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: fileType,
        ACL: 'private',
        Metadata: {
          'x-amz-acl': 'private'
        }
      });

      // Generate presigned URL with longer expiration
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
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
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      
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
        Bucket: this.bucketName,
        Key: s3Key
      });

      await this.s3Client.send(command);
      
      logInfo('File deleted successfully', { s3Key });
    } catch (error) {
      logError('Error deleting file', error as Error, { s3Key });
      throw error;
    }
  }
}

export const s3Service = new S3Service();
