import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import PDFViewer from '../Components/PDFViewer/PDFViewer';
import ChatBot from '../Components/ChatBot';
import { documentService } from '../services/documentService';
import { useAppSelector } from '../store/hooks';

interface DocumentDetails {
  presignedUrl: string;
}

const DocumentChat: React.FC = () => {
  let { s3Key } = useParams<{ s3Key: string }>();
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      setError(null);
      setIsLoading(true);
      setDocumentDetails(null);

      try {
        if (!s3Key) {
          throw new Error('No document selected');
        }
        
        const response = await documentService.getDocumentAccessLinkByS3Key(s3Key);
        if (!response) {
          throw new Error('No URL received');
        }
        
        setDocumentDetails({ presignedUrl: response });
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setDocumentDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [s3Key]);

  const pdfViewerKey = documentDetails?.presignedUrl || 'no-url';

  return (
    <div className="flex flex-col h-screen bg-black">
      <Navbar />
      
      <div className="flex flex-1 mt-20 overflow-hidden">
        {/* Sidebar - visible by default on desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main content area with PDF and Chat side by side */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-hidden">
          {/* Flex container for PDF and Chat */}
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* PDF Viewer container */}
            <div className="flex-1 lg:w-2/3 min-h-0 order-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-purple-400">Loading...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-400">Error: {error}</div>
                </div>
              ) : documentDetails?.presignedUrl ? (
                <div className="w-full h-full overflow-auto">
                  <div className="w-full max-w-[1000px] mx-auto">
                    <PDFViewer 
                      key={pdfViewerKey}
                      url={documentDetails.presignedUrl} 
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Chat container */}
            <div className="flex-1 lg:w-1/3 lg:max-w-[400px] min-h-0 bg-gray-900/50 rounded-lg overflow-hidden order-2">
              {s3Key ? (
                <ChatBot 
                  documentS3Key={s3Key}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChat;
