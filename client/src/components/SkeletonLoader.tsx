import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'list';
  lines?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'text', 
  lines = 3, 
  className = '' 
}) => {
  const shimmerVariants = {
    initial: { opacity: 0.3 },
    animate: { 
      opacity: [0.3, 0.7, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`skeleton-card ${className}`}>
            <motion.div 
              className="skeleton-header"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />
            <motion.div 
              className="skeleton-content"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />
            <motion.div 
              className="skeleton-footer"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />
          </div>
        );

      case 'table':
        return (
          <div className={`skeleton-table ${className}`}>
            <motion.div 
              className="skeleton-table-header"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />
            {Array.from({ length: 5 }).map((_, index) => (
              <motion.div 
                key={index}
                className="skeleton-table-row"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>
        );

      case 'list':
        return (
          <div className={`skeleton-list ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
              <motion.div 
                key={index}
                className="skeleton-list-item"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>
        );

      default: // text
        return (
          <div className={`skeleton-text ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
              <motion.div 
                key={index}
                className="skeleton-line"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 }}
                style={{
                  width: index === lines - 1 ? '60%' : '100%'
                }}
              />
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
