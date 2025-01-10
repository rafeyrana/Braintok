import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSelector } from '../../store/hooks';
import { selectUserEmail } from '../../store/slices/userSlice';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const userEmail = useAppSelector(selectUserEmail);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { path: '/home', label: 'Home' },
    { path: '/braintoks', label: 'BrainToks' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/home" className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              BRAINTOK
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2.5 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-purple-400 bg-purple-900/20'
                      : 'text-gray-300 hover:text-purple-400 hover:bg-purple-900/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <span className="text-base text-gray-300">{userEmail}</span>
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-md text-base font-medium text-gray-300 hover:text-purple-400 hover:bg-purple-900/10 transition-colors duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Controls */}
          <div className="flex items-center space-x-4 md:hidden">
            {/* User Menu Button - Mobile */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-gray-300 hover:text-purple-400 p-2"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* User Dropdown Menu - Mobile */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                      {userEmail}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-900/20 hover:text-purple-400"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Menu Button - Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-purple-400 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'text-purple-400 bg-purple-900/20'
                    : 'text-gray-300 hover:text-purple-400 hover:bg-purple-900/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
