import React, { useState } from 'react';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import UploadDoc from '../Components/UploadDoc';
import { useAppSelector } from '../store/hooks';
import { selectUserEmail } from '../store/slices/userSlice';

const HomePage: React.FC = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const [oldUser] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navbar />
      
      <div className="flex mt-16 w-full relative">
        <div className="absolute z-50">
          <Sidebar />
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6 w-full">
          {oldUser ? (
            <div className="py-4 sm:py-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-purple-400">Welcome to BRAINTOK</h1>
              <p className="mt-2 sm:mt-4 text-gray-300">Logged in as: {userEmail}</p>
            </div>
          ) : (
            <UploadDoc />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;