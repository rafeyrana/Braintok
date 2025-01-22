import axiosInstance from "../lib/axios";

export const buildTiktok = async (pdfUrl: string, email : string) => {
    try {
        console.log("building tiktok call made with url: ", pdfUrl, " and email: ", email)
        const response = await axiosInstance.get('/tiktok/build-tiktok', {
            params: {
                s3Key: pdfUrl ,
                email : email
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to build TikTok:', error);
        throw error;
    }
}