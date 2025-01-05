import { useNavigate } from 'react-router-dom';

interface DocumentCardProps {
  name: string;
  s3Key: string;
  email: string;
  onDelete: (s3Key: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ name, s3Key, email, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const encodedS3Key = encodeURIComponent(s3Key);
    navigate(`/document-chat/${encodedS3Key}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(s3Key);
  };

  return (
    <div 
      className="p-3 mb-2 bg-purple-800 rounded-lg cursor-pointer hover:bg-[#8b7091] transition-colors group relative"
      onClick={handleClick}
    >
      <p className="text-gray-200 truncate pr-6">{name}</p>
      <button
        onClick={handleDelete}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white"
        aria-label="Delete document"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default DocumentCard;