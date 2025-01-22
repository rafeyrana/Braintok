import { s3Service } from './s3Service';
class TiktokService {
    constructor() {
        this.buildTiktokFromDoc = this.buildTiktokFromDoc.bind(this);
    }

    async buildTiktokFromDoc(s3Key : string, email : string) {
        try {
            // Extract just the key path from the full signed URL
            console.log('Original S3 URL:', s3Key);
            const urlObj = new URL(s3Key);
            console.log('URL pathname:', urlObj.pathname);
            // Remove the leading slash but keep the full path
            const s3KeyFromUrl = decodeURIComponent(urlObj.pathname.substring(1));
            console.log('Final S3 key path:', s3KeyFromUrl);
            
            // Get the PDF content using the extracted key
            const pdfContent = await s3Service.getObjectContent(s3KeyFromUrl);
            console.log('Successfully retrieved PDF content from S3', pdfContent);
            return "this is the video url init"
        } catch (error) {
            console.error('Error fetching object content from S3', error as Error, { s3Key });
            throw new Error('Failed to fetch object content from S3');
        }
    }
}

export const tiktokService = new TiktokService();