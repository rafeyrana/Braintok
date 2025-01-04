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
          const docs = await documentService.getDocuments(userEmail);
          setDocuments(docs);
        } catch (error) {
          console.error('Failed to fetch documents:', error);
        }
      }
    };

    fetchDocuments();
  }, [userEmail]);

  return (
    <div className="w-64 h-[calc(100vh-5rem)] bg-black p-4">
      <h2 className="text-xl font-bold text-purple-400 mb-4">Your Documents</h2>
      <div className="space-y-2 overflow-y-auto h-full">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.s3_key}
            name={doc.filename}
            s3Key={doc.s3_key}
            email={userEmail || ''}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;