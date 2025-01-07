import axiosInstance from "../lib/axios";

export const fetchPreviousMessages = async (email: string, s3Key:string) => {
    try{
        const response = await axiosInstance.get('/messages/fetch-all-messages', {
            params: {
                email,
                s3Key
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch previous messages:', error);
        throw error;
    }
}