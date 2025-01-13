import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import DocumentCard from '../DocumentCard/DocumentCard';
import { Document } from '../../types/documents';
import { useAppSelector } from '../../store/hooks';
import { selectUserEmail } from '../../store/slices/userSlice';
import { deleteFileByS3Key } from '../../api/deleteFileByS3Key';
const Sidebar: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userEmail = useAppSelector(selectUserEmail);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (userEmail) {
        try {
          const docs = await documentService.getDocuments(userEmail);
          setDocuments(Array.isArray(docs) ? docs : []);
        } catch (error) {
          console.error('Failed to fetch documents:', error);
          setDocuments([]);
        }
      }
      
    };

    fetchDocuments();
  }, [userEmail]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleDeleteDocument = async (s3Key: string) => {
    try {
      console.log('Deleting document with s3Key:', s3Key);
      const response = await deleteFileByS3Key(userEmail || "", s3Key);
      console.log('Response:', response);
      setDocuments(prevDocs => prevDocs.filter(doc => doc.s3_key !== s3Key));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <>
      {isCollapsed ? (
        <button
          onClick={toggleSidebar}
          className="fixed left-0 top-24 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-r-md transition-all duration-300 ease-in-out"
          aria-label="Expand sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div className="w-64 h-[calc(100vh-5rem)] bg-black p-4 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-400">Your Documents</h2>
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Collapse sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto h-full">
            {Array.isArray(documents) && documents.map((doc) => (
              <DocumentCard
                key={doc.s3_key}
                name={doc.filename}
                s3Key={doc.s3_key}
                email={userEmail || ''}
                onDelete={handleDeleteDocument}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;