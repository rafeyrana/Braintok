import React, { useState } from 'react';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import UploadDoc from '../Components/UploadDoc';
import { useAppSelector } from '../store/hooks';

const HomePage: React.FC = () => {

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      
      <div className="flex mt-16 w-full relative">
        <div className="absolute z-50">
          <Sidebar />
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6 w-full">
            <UploadDoc />
        </div>
      </div>
    </div>
  );
};

export default HomePage;