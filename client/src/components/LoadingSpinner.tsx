import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tennis-green"></div>
      <span className="text-tennis-dark font-medium">Processing your question...</span>
    </div>
  );
};

export default LoadingSpinner;
