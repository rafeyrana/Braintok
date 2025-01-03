import axios, { AxiosError } from 'axios';



export const getDocumentsByEmail = async (email: string): Promise<Document[]> => {
    try {
      const response = await axios.get<Document[]>('/api/documents/get-documents-by-email', {
        params: { email },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string }>;
        throw new Error(axiosError.response?.data?.error || 'Failed to fetch documents');
      }
      throw new Error('An unexpected error occurred');
    }
  };
  