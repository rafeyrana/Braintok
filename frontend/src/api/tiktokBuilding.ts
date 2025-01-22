import axiosInstance from "../lib/axios";

export const buildTiktok = async (pdfUrl: string) => {
    try {
        const response = await axiosInstance.get('/tiktok/build-tiktok', {
            params: {
                pdfUrl
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to build TikTok:', error);
        throw error;
    }
}