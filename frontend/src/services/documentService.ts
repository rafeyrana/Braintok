import axiosInstance from '../lib/axios';
import {
  DocumentUploadResponse,
  UploadCompletion,
  UploadProgress,
  Document,
} from '../types/documents';

class DocumentUploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public fileName?: string
  ) {
    super(message);
    this.name = 'DocumentUploadError';
  }
}

export class DocumentService {
  private async requestPresignedUrls(files: File[], email: string): Promise<DocumentUploadResponse> {
    try {
      const response = await axiosInstance.post('/documents/request-upload', {
        files: files.map(file => ({
          filename: file.name,
          fileType: file.type,
          size: file.size
        })),
        email
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting presigned URLs:', error);
      throw new DocumentUploadError(
        'Failed to initiate upload',
        'PRESIGNED_URL_ERROR'
      );
    }
  }

  private async uploadFileToS3(
    file: File,
    presignedUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      await axiosInstance.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);
          }
        }
      });
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new DocumentUploadError(
        'Failed to upload file to storage',
        'S3_UPLOAD_ERROR',
        file.name
      );
    }
  }

  private async confirmUpload(completion: UploadCompletion): Promise<void> {
    try {
      await axiosInstance.post('/documents/confirm-upload', completion);
    } catch (error) {
      console.error('Error confirming upload:', error);
      throw new DocumentUploadError(
        'Failed to confirm upload',
        'CONFIRMATION_ERROR'
      );
    }
  }

  async uploadDocuments(
    files: File[],
    email: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    try {
      const { uploads } = await this.requestPresignedUrls(files, email);

      const uploadResults = await Promise.all(
        uploads.map(async (upload, index) => {
          const file = files[index];
          try {
            await this.uploadFileToS3(file, upload.presignedUrl, (progress) => {
              onProgress?.({
                [file.name]: progress
              });
            });

            return {
              documentId: upload.documentId,
              s3Key: upload.s3Key,
              status: 'success' as const,
              metadata: {
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString()
              }
            };
          } catch (error) {
            return {
              documentId: upload.documentId,
              s3Key: upload.s3Key,
              status: 'failed' as const,
              error: error instanceof Error ? error.message : 'Upload failed',
              metadata: {
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString()
              }
            };
          }
        })
      );

      await this.confirmUpload({
        documents: uploadResults,
        email
      });
    } catch (error) {
      if (error instanceof DocumentUploadError) {
        throw error;
      }
      throw new DocumentUploadError(
        'Upload failed',
        'UPLOAD_ERROR'
      );
    }
  }

  async getDocuments(email: string): Promise<Document[]> {
    try {
      const response = await axiosInstance.get('/documents/get-documents-by-email', {
        params: { email }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new DocumentUploadError(
        'Failed to fetch documents',
        'FETCH_ERROR'
      );
    }
  }

  async getDocumentAccessLinkByS3Key(s3Key: string): Promise<string> {
    const response = await axiosInstance.get('/documents/get-document-access-link', {
      params: { s3Key }
    });
    return response.data.presignedUrl;
  }
}

export const documentService = new DocumentService();
