import React, { useState } from 'react';

interface TikTokCardProps {
  pdfUrl: string;
  videoUrl?: string;
}

const TikTokCard: React.FC<TikTokCardProps> = ({ pdfUrl, videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleVideoClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[9/16] max-w-sm w-full mx-auto shadow-lg">
      {/* Video Container */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            className="w-full h-full object-cover"
            src={videoUrl}
            loop
            playsInline
            onClick={handleVideoClick}
            onLoadedData={handleVideoLoad}
            autoPlay={isPlaying}
            muted={!isPlaying}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-gray-400 text-center p-4">
              <p className="mb-2">Processing PDF</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
      
      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">From PDF:</p>
            <p className="text-xs truncate max-w-[200px] opacity-60">{decodeURIComponent(pdfUrl)}</p>
          </div>
          {videoUrl && (
            <button 
              className="bg-purple-500 p-2 rounded-full shadow-lg"
              onClick={handleVideoClick}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TikTokCard; 