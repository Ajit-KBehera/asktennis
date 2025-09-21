import React, { useState, useRef, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import './QueryInput.css';

interface QueryInputProps {
  onQuery: (question: string) => void;
  isLoading: boolean;
}

// Animation variants for QueryInput
const inputVariants = {
  focused: {
    scale: 1.02,
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  },
  unfocused: {
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  }
};

const buttonVariants = {
  enabled: {
    scale: 1,
    backgroundColor: 'var(--color-primary-600)',
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  },
  disabled: {
    scale: 1,
    backgroundColor: 'var(--color-gray-400)',
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  },
  hover: {
    scale: 1.05,
    backgroundColor: 'var(--color-primary-700)',
    transition: { type: "spring" as const, stiffness: 400, damping: 10 }
  },
  tap: {
    scale: 0.95,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 }
  }
};

const suggestionVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const suggestionItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  },
  hover: {
    x: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    transition: { type: "spring" as const, stiffness: 400, damping: 10 }
  }
};

const QueryInput: React.FC<QueryInputProps> = ({ onQuery, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Tennis-specific example queries (like AskCricinfo)
  const exampleQueries = [
    "Who has won the most Grand Slam titles?",
    "What is the fastest serve ever recorded?",
    "Who leads the head-to-head between Djokovic and Nadal?",
    "Which player has the most aces in their career?",
    "Who is the youngest player to win a Grand Slam?",
    "What is the longest match in tennis history?",
    "Who has won the most Wimbledon titles?",
    "Which country has produced the most Grand Slam winners?"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onQuery(question);
      setQuestion('');
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    setShowSuggestions(e.target.value.length > 0 && e.target.value.length < 50);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setFocused(true);
    if (question.length > 0 && question.length < 50) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [question]);

  return (
    <div className="ask-tennis-input">
      <Form onSubmit={handleSubmit}>
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2 
            className="heading-3 text-primary mb-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Ask a tennis question
          </motion.h2>
          <motion.p 
            className="text-secondary body-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Get instant answers about players, tournaments, and statistics
          </motion.p>
        </motion.div>
        
        <div className="input-container">
          <div className="input-wrapper">
            <motion.div
              className="input-field-wrapper"
              variants={inputVariants}
              animate={focused ? "focused" : "unfocused"}
            >
              <Form.Control
                ref={inputRef}
                as="textarea"
                value={question}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={focused ? "Ask anything about tennis..." : "Who has won the most Grand Slam titles?"}
                rows={1}
                disabled={isLoading}
                className="ask-input"
                style={{
                  width: '100%',
                  minHeight: '56px',
                  padding: '16px 20px',
                  fontSize: 'var(--font-size-lg)',
                  resize: 'none',
                  borderRadius: 'var(--radius-2xl)',
                  border: focused ? '2px solid var(--color-primary-500)' : '2px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: 'var(--color-gray-900)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all var(--transition-base)',
                  boxShadow: focused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'var(--shadow-md)',
                  fontFamily: 'var(--font-family-primary)',
                  outline: 'none'
                }}
              />
            </motion.div>
            
            <motion.button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="submit-button"
              variants={buttonVariants}
              animate={question.trim() && !isLoading ? "enabled" : "disabled"}
              whileHover={question.trim() && !isLoading ? "hover" : {}}
              whileTap={question.trim() && !isLoading ? "tap" : {}}
              style={{
                minHeight: '56px',
                width: '56px',
                padding: '0',
                margin: '0 0 0 8px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-2xl)',
                boxShadow: 'var(--shadow-md)',
                cursor: question.trim() && !isLoading ? 'pointer' : 'not-allowed',
                background: question.trim() && !isLoading ? 'var(--color-primary-600)' : 'var(--color-gray-400)',
                transition: 'all var(--transition-base)',
                zIndex: 10
              }}
            >
              {isLoading ? (
                <motion.div 
                  className="spinner-border spinner-border-sm text-white" 
                  role="status" 
                  style={{ width: '20px', height: '20px' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <span className="visually-hidden">Loading...</span>
                </motion.div>
              ) : (
                <motion.i 
                  className="bi bi-arrow-right text-white" 
                  style={{ fontSize: '20px' }}
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                ></motion.i>
              )}
            </motion.button>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div 
                className="suggestions-dropdown"
                variants={suggestionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div 
                  className="suggestions-header"
                  variants={suggestionItemVariants}
                >
                  <small className="text-muted">Try asking:</small>
                </motion.div>
                {exampleQueries
                  .filter(query => 
                    query.toLowerCase().includes(question.toLowerCase()) || 
                    question.length === 0
                  )
                  .slice(0, 4)
                  .map((suggestion, index) => (
                    <motion.div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                      variants={suggestionItemVariants}
                      whileHover="hover"
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.i 
                        className="bi bi-lightbulb me-2 text-warning"
                        animate={{ 
                          color: ['#ffc107', '#ffed4e', '#ffc107'],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      ></motion.i>
                      {suggestion}
                    </motion.div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.div 
          className="text-center mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.small 
            className="text-muted body-small"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Press Enter to submit • Examples: "Who has the most aces?", "Djokovic vs Nadal head-to-head"
          </motion.small>
        </motion.div>
      </Form>

    </div>
  );
};

export default QueryInput;
