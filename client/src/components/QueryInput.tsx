import React, { useState, useRef, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import './QueryInput.css';

interface QueryInputProps {
  onQuery: (question: string) => void;
  isLoading: boolean;
}

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
        <div className="text-center mb-4">
          <h2 className="h3 fw-bold text-white mb-3">Ask a tennis question</h2>
          <p className="text-white-50">Get instant answers about players, tournaments, and statistics</p>
        </div>
        
        <div className="input-container position-relative">
          <div className="input-wrapper">
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
                borderRadius: '12px',
                border: focused ? '2px solid #007bff' : '2px solid rgba(255, 255, 255, 0.3)',
                fontSize: '1.1rem',
                resize: 'none',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#333',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                boxShadow: focused ? '0 0 0 3px rgba(0, 123, 255, 0.1)' : '0 2px 10px rgba(0, 0, 0, 0.1)',
                paddingRight: '60px'
              }}
            />
            <Button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="submit-btn"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRadius: '8px',
                width: '44px',
                height: '44px',
                padding: '0',
                background: question.trim() && !isLoading ? '#007bff' : '#6c757d',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm text-white" role="status" style={{ width: '16px', height: '16px' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <i className="bi bi-search text-white" style={{ fontSize: '16px' }}></i>
              )}
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="suggestions-dropdown">
              <div className="suggestions-header">
                <small className="text-muted">Try asking:</small>
              </div>
              {exampleQueries
                .filter(query => 
                  query.toLowerCase().includes(question.toLowerCase()) || 
                  question.length === 0
                )
                .slice(0, 4)
                .map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <i className="bi bi-lightbulb me-2 text-warning"></i>
                    {suggestion}
                  </div>
                ))}
            </div>
          )}
        </div>
        
        <div className="text-center mt-3">
          <small className="text-white-50">
            Press Enter to submit • Examples: "Who has the most aces?", "Djokovic vs Nadal head-to-head"
          </small>
        </div>
      </Form>

    </div>
  );
};

export default QueryInput;
