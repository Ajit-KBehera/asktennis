import React, { useState } from 'react';

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

  const exampleQuestions = [
    "Who has the most aces in Grand Slam finals?",
    "What is Novak Djokovic's record against Rafael Nadal?",
    "Who has won the most Wimbledon titles?",
    "Which player has the highest first serve percentage?",
    "Who was the youngest player to win a Grand Slam?"
  ];

  const handleExampleClick = (example: string) => {
    setQuestion(example);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Ask a tennis question:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Who has the most aces in Grand Slam finals?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tennis-green focus:border-transparent resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="px-6 py-3 bg-tennis-green text-white font-medium rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-tennis-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Ask Question'}
          </button>
          
          <div className="text-sm text-gray-500">
            Press Enter to submit, Shift+Enter for new line
          </div>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-3">Try these example questions:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQuestions.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:ring-2 focus:ring-tennis-green focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QueryInput;
