export interface RequestUploadDTO {
  files: {
    filename: string;
    fileType: string;
    size: number;
  }[];
  email: string;
}

export interface PresignedUrlResponse {
  documentId: string;
  presignedUrl: string;
  s3Key: string;
}

export interface UploadCompletionDTO {
  documents: {
    documentId: string;
    s3Key: string;
    status: 'success' | 'failed';
    error?: string;
    metadata: {
      size: number;
      type: string;
      lastModified: string;
    };
  }[];
  email: string;
}

export interface Document {
  id: string;
  user_email: string;
  filename: string;
  s3_key: string;
  file_size: number;
  file_type: string;
  upload_status?: 'pending' | 'completed' | 'failed';
  created_at: Date;
  error?: string;
}
