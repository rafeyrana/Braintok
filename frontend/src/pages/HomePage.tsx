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
    <div className="min-h-screen bg-black text-gray-100">
      <Navbar />
      <Sidebar />
      <main className="pt-16 pl-64 container mx-auto px-4 sm:px-6 lg:px-8">
        {oldUser ? (
          <div className="py-8">
            <h1 className="text-3xl font-bold text-purple-400">Welcome to BRAINTOK</h1>
            <p className="mt-4 text-gray-300">Logged in as: {userEmail}</p>
          </div>
        ) : (
          <UploadDoc />
        )}
      </main>
    </div>
  );
};

export default HomePage;