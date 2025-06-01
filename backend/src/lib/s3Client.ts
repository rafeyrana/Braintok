// backend/src/lib/s3Client.ts
import { S3Client } from '@aws-sdk/client-s3';
import logger from '../utils/logger';

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
export const bucketName = process.env.S3_BUCKET_NAME; // Export bucketName too

if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
  logger.error('Missing required AWS configuration for S3. Check .env file.');
  throw new Error('Missing required AWS configuration for S3. Check .env file.');
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

logger.info('S3 client initialized successfully.', { region, bucket: bucketName });
export default s3Client;
