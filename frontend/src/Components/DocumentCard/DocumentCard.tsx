import { useNavigate } from 'react-router-dom';

interface DocumentCardProps {
  name: string;
  s3Key: string;
  email: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ name, s3Key, email }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const encodedS3Key = encodeURIComponent(s3Key);
    navigate(`/document-chat/${encodedS3Key}`);
  };

  return (
    <div 
      className="p-3 mb-2 bg-purple-800 rounded-lg cursor-pointer hover:bg-[#8b7091] transition-colors"
      onClick={handleClick}
    >
      <p className="text-gray-200 truncate">{name}</p>
    </div>
  );
};

export default DocumentCard;