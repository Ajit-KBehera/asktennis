import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return 'bi-laptop';
    }
    return resolvedTheme === 'dark' ? 'bi-moon-fill' : 'bi-sun-fill';
  };

  const getTooltip = () => {
    if (theme === 'system') {
      return 'System theme (auto)';
    }
    return resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  };

  return (
    <motion.button
      className="btn btn-outline-secondary btn-sm theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      title={getTooltip()}
      style={{
        position: 'fixed',
        top: 'var(--space-4)',
        right: 'var(--space-4)',
        zIndex: 1000,
        borderRadius: 'var(--radius-full)',
        width: '44px',
        height: '44px',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'var(--shadow-glass)',
        color: 'var(--text-primary)'
      }}
    >
      <motion.i 
        className={`bi ${getIcon()}`}
        animate={{ 
          rotate: theme === 'system' ? [0, 10, -10, 0] : 0,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: theme === 'system' ? 2 : 0.3,
          repeat: theme === 'system' ? Infinity : 0,
          repeatDelay: theme === 'system' ? 3 : 0
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle;
