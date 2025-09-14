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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="question" className="block text-center text-xl font-bold text-tennis-dark mb-6">
            Ask a tennis question
          </label>
          <div className="flex gap-4 items-start">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Who has the most aces in Grand Slam finals?"
              className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tennis-green focus:border-transparent resize-none text-lg"
              rows={4}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="px-8 py-4 bg-tennis-green text-white font-semibold rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-tennis-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg whitespace-nowrap"
            >
              {isLoading ? 'Processing...' : 'Ask Question'}
            </button>
          </div>
          <div className="text-center text-sm text-gray-500 mt-3">
            Press Enter to submit, Shift+Enter for new line
          </div>
        </div>
      </form>

      <div className="mt-8">
        <p className="text-center text-lg font-semibold text-gray-700 mb-4">Try these example questions:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleQuestions.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="px-4 py-3 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-tennis-green focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left border border-gray-200 hover:border-tennis-green"
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
