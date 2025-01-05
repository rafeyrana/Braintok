import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import PDFViewer from '../Components/PDFViewer/PDFViewer';
import { documentService } from '../services/documentService';

interface DocumentDetails {
  presignedUrl: string;
}

const DocumentChat: React.FC = () => {
  let { s3Key } = useParams<{ s3Key: string }>();
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string[]>([]);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      // Reset states when fetching new document
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
  }, [s3Key]); // Only re-run when s3Key changes

  const handleTextSelect = (text: string) => {
    setSelectedText(prev => [...prev, text]);
  };

  // Key prop added to force PDFViewer remount when URL changes
  const pdfViewerKey = documentDetails?.presignedUrl || 'no-url';

  return (
    <div className = "p-4">
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      
      <div className="flex mt-20">
        <Sidebar />

        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-purple-400">Loading...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-400">Error: {error}</div>
            </div>
          ) : documentDetails?.presignedUrl ? (
            <div className="w-full">
              <PDFViewer 
                key={pdfViewerKey}
                url={documentDetails.presignedUrl} 
                onTextSelect={handleTextSelect}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </div>
  );
};

export default DocumentChat;
