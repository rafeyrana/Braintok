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
      {/* Navbar */}
      <Navbar />
      
      {/* Content container below navbar */}
      <div className="flex mt-20"> {/* mt-20 to create space below navbar */}
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 p-6">
          {oldUser ? (
            <div className="py-8">
              <h1 className="text-3xl font-bold text-purple-400">Welcome to BRAINTOK</h1>
              <p className="mt-4 text-gray-300">Logged in as: {userEmail}</p>
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