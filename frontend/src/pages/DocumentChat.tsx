import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import PDFViewer from '../Components/PDFViewer/PDFViewer';
import ChatBot from '../Components/ChatBot';
import { documentService } from '../services/documentService';
import { useAppSelector } from '../store/hooks';
import { selectUserEmail } from '../store/slices/userSlice';

interface DocumentDetails {
  presignedUrl: string;
}

const DocumentChat: React.FC = () => {
  let { s3Key } = useParams<{ s3Key: string }>();
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string[]>([]);
  const userEmail = useAppSelector(selectUserEmail);

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

  const handleTextSelect = (text: string) => {
    setSelectedText(prev => [...prev, text]);
  };

  const pdfViewerKey = documentDetails?.presignedUrl || 'no-url';

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      
      <div className="flex mt-20">
        <Sidebar />

        <div className="flex flex-1 gap-6 p-6">
          {/* Left side - PDF Viewer */}
          <div className="flex-none">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 w-[800px]">
                <div className="text-purple-400">Loading...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 w-[800px]">
                <div className="text-red-400">Error: {error}</div>
              </div>
            ) : documentDetails?.presignedUrl ? (
              <PDFViewer 
                key={pdfViewerKey}
                url={documentDetails.presignedUrl} 
                onTextSelect={handleTextSelect}
              />
            ) : null}
          </div>

          {/* Right side - Chat Component */}
          <div className="flex-1 bg-gray-900/50 rounded-lg">
            {userEmail && s3Key ? (
              <ChatBot 
                userEmail={userEmail}
                documentS3Key={s3Key}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChat;
