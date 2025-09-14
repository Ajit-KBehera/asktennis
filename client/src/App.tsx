import React, { useState } from 'react';
import axios from 'axios';
import QueryInput from './components/QueryInput';
import QueryHistory from './components/QueryHistory';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import Footer from './components/Footer';

interface QueryResult {
  question: string;
  answer: string;
  data: any;
  cached: boolean;
  timestamp: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async (question: string) => {
    if (!question.trim()) return;

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/query`, {
        question: question.trim(),
        userId: 'user-123' // In a real app, this would come from authentication
      });

      const result: QueryResult = response.data;
      setQueryHistory(prev => [result, ...prev]);
      
    } catch (error) {
      console.error('Query error:', error);
      const errorResult: QueryResult = {
        question,
        answer: 'Sorry, I encountered an error processing your question. Please try again.',
        data: null,
        cached: false,
        timestamp: new Date().toISOString()
      };
      setQueryHistory(prev => [errorResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setQueryHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tennis-light to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-tennis-dark mb-4">
            🎾 AskTennis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ask any tennis question in natural language and get precise statistical answers. 
            From player records to tournament statistics, I've got you covered!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <QueryInput onQuery={handleQuery} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="flex justify-center mb-8">
            <LoadingSpinner />
          </div>
        )}

        {queryHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-tennis-dark">
                Query History
              </h2>
              <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear History
              </button>
            </div>
            <QueryHistory history={queryHistory} />
          </div>
        )}

        {queryHistory.length === 0 && !isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎾</div>
            <h3 className="text-xl font-semibold text-tennis-dark mb-2">
              Ready to Answer Your Tennis Questions!
            </h3>
            <p className="text-gray-600 mb-6">
              Try asking questions like:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Player Statistics:</p>
                <p className="font-medium">"Who has the most aces in Grand Slam finals?"</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Head-to-Head:</p>
                <p className="font-medium">"What is Novak Djokovic's record against Rafael Nadal?"</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Tournament Records:</p>
                <p className="font-medium">"Who has won the most Wimbledon titles?"</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Performance Metrics:</p>
                <p className="font-medium">"Which player has the highest first serve percentage?"</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
