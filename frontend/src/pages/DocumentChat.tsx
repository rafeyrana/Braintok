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
      try {
        console.log("calling getDocumentAccesslinkbys3kye using s3key: ", s3Key);
        if (!s3Key){
            s3Key = ""
        }
        const response = await documentService.getDocumentAccessLinkByS3Key(s3Key);
        if (!response) {
          setError('No URL received');
          return;
        }
        setDocumentDetails({ presignedUrl: response });
        console.log("documentDetails: ", documentDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocumentDetails();
  }, [s3Key]);

  const handleTextSelect = (text: string) => {
    setSelectedText(prev => [...prev, text]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Navbar */}
      <Navbar />
      
      {/* Content container below navbar */}
      <div className="flex mt-20">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
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
                url={documentDetails.presignedUrl} 
                onTextSelect={handleTextSelect}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DocumentChat;
