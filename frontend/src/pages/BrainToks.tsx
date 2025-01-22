import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import TikTokCard from '../Components/TikTokCard/TikTokCard';
import { buildTiktok } from '../api/tiktokBuilding';

interface VideoData {
  pdfUrl: string;
  videoUrl?: string;
}

const BrainToks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const pdfUrl = searchParams.get('url');

  useEffect(() => {
    if (pdfUrl) {
      // Add the new PDF to the list of videos being processed
      setVideos(prev => [...prev, { pdfUrl }]);
      const video_url = buildTiktok(pdfUrl);
      console.log(video_url)

      // The backend will return a video URL once processing is complete
      // For now, we'll just show the processing state
    }
  }, [pdfUrl]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      <div className="flex mt-16 w-full relative">
        <div className="absolute z-50">
          <Sidebar />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {videos.map((video, index) => (
              <TikTokCard
                key={index}
                pdfUrl={video.pdfUrl}
                videoUrl={video.videoUrl}
              />
            ))}
            {videos.length === 0 && (
              <div className="text-gray-400 text-center col-span-full p-8">
                No videos yet. Click "Tiktokify" on a PDF to create one!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainToks;