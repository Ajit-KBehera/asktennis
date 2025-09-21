import React from 'react';
import { motion } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';

const LoadingSpinner: React.FC = () => {
  return (
    <motion.div 
      className="d-flex flex-column align-items-center justify-content-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="mb-3"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid var(--color-primary-500)',
          borderRadius: '50%'
        }}
      />
      <motion.span 
        className="text-primary body-base mb-3"
        animate={{ 
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        Processing your question...
      </motion.span>
      
      {/* Skeleton loader for response preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ width: '100%', maxWidth: '500px' }}
      >
        <SkeletonLoader type="card" />
      </motion.div>
    </motion.div>
  );
};

export default LoadingSpinner;
