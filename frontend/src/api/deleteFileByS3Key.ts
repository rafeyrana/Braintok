import axiosInstance from '../lib/axios';

export const deleteFileByS3Key = async (email: string, s3Key: string): Promise<any> => {
    try {
        const response = await axiosInstance.delete('/documents/delete-document-by-s3-key', {
            params: {
                email,
                s3Key
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to delete file by S3 key:', error);
        throw error;
    }
};