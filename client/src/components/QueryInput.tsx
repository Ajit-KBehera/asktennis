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
    "Who is the current number 1 player?",
    "Show me the top 5 players",
    "Tell me about Jannik Sinner",
    "What tournaments are available?",
    "Who is ranked 2 and 4?",
    "What are the Grand Slam tournaments?"
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
          <div className="flex gap-4 items-center">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about tennis players, tournaments, records, or statistics..."
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-tennis-green/20 focus:border-tennis-green resize-none text-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="px-8 py-4 bg-gradient-to-r from-tennis-green to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-tennis-green/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Ask Question</span>
                </div>
              )}
            </button>
          </div>
          <div className="text-center text-sm text-gray-500 mt-3">
            Press Enter to submit, Shift+Enter for new line
          </div>
        </div>
      </form>

      <div className="mt-10">
        <p className="text-center text-lg font-semibold text-gray-700 mb-6">Try these example questions:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exampleQuestions.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="px-5 py-4 text-sm bg-white/60 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white hover:shadow-md focus:ring-2 focus:ring-tennis-green/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left border border-gray-200/50 hover:border-tennis-green/50 hover:scale-[1.02]"
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
