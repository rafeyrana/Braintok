import { createClient } from '@supabase/supabase-js';
import { Document, UploadCompletionDTO } from '../types/documents';
import { v4 as uuidv4 } from 'uuid';

class DocumentService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required. Check your .env file.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async createPendingDocument(
    email: string,
    filename: string,
    s3Key: string,
    fileSize: number,
    fileType: string
  ): Promise<string> {
    try {
      const documentId = uuidv4();
      const { error } = await this.supabase.from('documents').insert({
        id: documentId,
        user_email: email,
        filename,
        s3_key: s3Key,
        file_size: fileSize,
        file_type: fileType,
        upload_status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Supabase error creating document:', error);
        throw error;
      }
      return documentId;
    } catch (error) {
      console.error('Error creating pending document:', error);
      throw new Error('Failed to create pending document');
    }
  }

  async updateDocumentStatus(
    documentId: string,
    status: 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const { error: updateError } = await this.supabase
        .from('documents')
        .update({
          upload_status: status,
          error: error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Supabase error updating document status:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      throw new Error('Failed to update document status');
    }
  }

  async processUploadCompletion(completion: UploadCompletionDTO): Promise<void> {
    try {
      const { documents, email } = completion;

      for (const doc of documents) {
        const { error } = await this.supabase
          .from('documents')
          .update({
            upload_status: doc.status,
            error: doc.error,
            updated_at: new Date().toISOString(),
          })
          .match({ id: doc.documentId, user_email: email });

        if (error) {
          console.error('Supabase error processing upload completion:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error processing upload completion:', error);
      throw new Error('Failed to process upload completion');
    }
  }

  async getDocumentsByEmail(email: string): Promise<Document[]> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching documents:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  async deleteDocumentByS3Key(email: string, s3Key: string): Promise<void> {
    try {
      await this.supabase.from('documents').delete().eq('user_email', email).eq('s3_key', s3Key);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }
}

export const documentService = new DocumentService();
