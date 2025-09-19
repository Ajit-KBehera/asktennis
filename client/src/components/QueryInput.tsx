import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

interface QueryInputProps {
  onQuery: (question: string) => void;
  isLoading: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onQuery, isLoading }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onQuery(question);
      setQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };


  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <div className="text-center mb-4">
          <h2 className="h3 fw-bold text-dark mb-3">Ask a tennis question</h2>
          <p className="text-muted">Get instant answers about players, tournaments, and statistics</p>
        </div>
        
        <InputGroup className="mb-3" size="lg">
          <Form.Control
            as="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about tennis players, tournaments, records, or statistics..."
            rows={4}
            disabled={isLoading}
            style={{
              borderRadius: '15px 0 0 15px',
              border: '2px solid #e9ecef',
              fontSize: '1.1rem',
              resize: 'none'
            }}
          />
          <Button
            type="submit"
            disabled={!question.trim() || isLoading}
            variant="primary"
            size="lg"
            style={{
              borderRadius: '0 15px 15px 0',
              minWidth: '120px',
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              border: 'none',
              fontWeight: '600'
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Ask
              </>
            )}
          </Button>
        </InputGroup>
        
        <div className="text-center">
          <small className="text-muted">
            Press Enter to submit, Shift+Enter for new line
          </small>
        </div>
      </Form>
    </div>
  );
};

export default QueryInput;
