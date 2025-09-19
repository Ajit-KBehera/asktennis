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
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="question" className="block text-center text-2xl font-bold text-tennis-dark mb-8">
            Ask a tennis question
          </label>
          <div className="flex gap-6 items-start">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about tennis players, tournaments, records, or statistics..."
              className="flex-1 px-8 py-6 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-tennis-green/20 focus:border-tennis-green resize-none text-xl shadow-lg hover:shadow-xl transition-all duration-200 bg-white/90 backdrop-blur-sm min-h-[120px]"
              rows={4}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="px-10 py-6 bg-gradient-to-r from-tennis-green to-green-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-tennis-green/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xl whitespace-nowrap shadow-xl hover:shadow-2xl transform hover:scale-105 min-h-[120px] flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex flex-col items-center space-y-2">
                  <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Processing...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">Ask</span>
                </div>
              )}
            </button>
          </div>
          <div className="text-center text-sm text-gray-500 mt-4">
            Press Enter to submit, Shift+Enter for new line
          </div>
        </div>
      </form>

      <div className="mt-12">
        <p className="text-center text-xl font-semibold text-gray-700 mb-8">Try these example questions:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exampleQuestions.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="px-6 py-5 text-base bg-white/70 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white hover:shadow-lg focus:ring-2 focus:ring-tennis-green/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left border border-gray-200/50 hover:border-tennis-green/50 hover:scale-[1.02] hover:shadow-xl"
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
