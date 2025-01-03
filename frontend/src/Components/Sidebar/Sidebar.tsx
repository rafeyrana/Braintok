import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';

import DocumentCard from '../DocumentCard/DocumentCard';
import { Document } from '../../types/documents';
import { useAppSelector } from '../../store/hooks';
import { selectUserEmail } from '../../store/slices/userSlice';

const Sidebar: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const userEmail = useAppSelector(selectUserEmail);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (userEmail) {
        try {
          console.log('Fetching documents for:', userEmail);
          const docs = await documentService.getDocuments(userEmail);
          setDocuments(docs);
        } catch (error) {
          console.error('Failed to fetch documents:', error);
        }
      }
    };

    fetchDocuments();
  }, []);

  const handleDocumentClick = (email: string, s3Key: string) => {
    console.log('Document clicked:', { email, s3Key });
  };

  return (
    <div className="w-64 h-screen bg-gray-900 p-4 fixed left-0 top-0 pt-16">
      <h2 className="text-xl font-bold text-purple-400 mb-4">Your Documents</h2>
      <div className="space-y-2">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.s3_key}
            name={doc.filename}
            s3Key={doc.s3_key}
            email={userEmail || ''}
            onClick={handleDocumentClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;