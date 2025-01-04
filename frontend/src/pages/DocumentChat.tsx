import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import { documentService } from '../services/documentService';

interface DocumentDetails {
  title: string;
  content: string;
}

const DocumentChat: React.FC = () => {
  let { s3Key } = useParams<{ s3Key: string }>();
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        console.log("calling getDocumentAccesslinkbys3kye using s3key: ", s3Key);
        if (!s3Key){
            s3Key = ""
        }
        const response = await documentService.getDocumentAccessLinkByS3Key(s3Key);
        console.log('response from getDocumentAccesslink: ', response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (s3Key) {
      fetchDocumentDetails();
    }
  }, [s3Key]);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navbar />
      <Sidebar />
      <main className="pt-16 pl-64 container mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-purple-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : documentDetails ? (
          <div className="py-8">
            <h1 className="text-3xl font-bold text-purple-400">{documentDetails.title}</h1>
            {/* Add your chat components here */}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default DocumentChat;
