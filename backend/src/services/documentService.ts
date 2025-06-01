import { Document, UploadCompletionDTO } from '../types/documents';
import { v4 as uuidv4 } from 'uuid';
import supabaseClient from '../lib/supabaseClient'; // Import centralized client

class DocumentService {
  constructor() {
    // Constructor can be used for other dependency injections if needed later.
    // For now, it's simplified as Supabase client is imported.
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
      const { error } = await supabaseClient.from('documents').insert({ // Use imported client
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
      const { error: updateError } = await supabaseClient // Use imported client
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
        const { error } = await supabaseClient // Use imported client
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
      const { data, error } = await supabaseClient // Use imported client
        .from('documents')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: true });

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
      await supabaseClient.from('documents').delete().eq('user_email', email).eq('s3_key', s3Key); // Use imported client
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }
}

export const documentService = new DocumentService();
