import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎾</div>
            <h1 className="text-2xl font-bold text-tennis-dark">AskTennis</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-tennis-dark transition-colors">
              Features
            </a>
            <a href="#examples" className="text-gray-600 hover:text-tennis-dark transition-colors">
              Examples
            </a>
            <a href="#about" className="text-gray-600 hover:text-tennis-dark transition-colors">
              About
            </a>
          </nav>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
