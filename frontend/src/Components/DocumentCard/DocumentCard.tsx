interface DocumentCardProps {
    name: string;
    s3Key: string;
    email: string;
    onClick: (email: string, s3Key: string) => void;
  }
  
  const DocumentCard: React.FC<DocumentCardProps> = ({ name, s3Key, email, onClick }) => {
    return (
      <div 
        className="p-3 mb-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => onClick(email, s3Key)}
      >
        <p className="text-gray-200 truncate">{name}</p>
      </div>
    );
  };
  
  export default DocumentCard;