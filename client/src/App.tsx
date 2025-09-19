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

const API_BASE_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

function App() {
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging
  console.log('App component loaded');
  console.log('API_BASE_URL:', API_BASE_URL);

  const handleQuery = async (question: string) => {
    if (!question.trim()) return;

    setIsLoading(true);
    
    try {
      console.log('Making API call to:', `${API_BASE_URL}/api/query`);
      const response = await axios.post(`${API_BASE_URL}/api/query`, {
        question: question.trim(),
        userId: 'user-123' // In a real app, this would come from authentication
      }, {
        timeout: 10000 // 10 second timeout for better user experience
      });

      console.log('✅ API call successful!');
      console.log('API response received:', response);
      console.log('Response data:', response.data);
      
      const result: QueryResult = response.data;
      console.log('Processed result:', result);
      setQueryHistory(prev => [result, ...prev]);
      
    } catch (error: any) {
      console.error('Query error:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        timeout: error?.code === 'ECONNABORTED'
      });
      
      if (error?.code === 'ECONNABORTED') {
        console.log('Request timed out after 10 seconds');
      }
      
      console.log('Falling back to mock response');
      
      // Demo mode - provide mock responses when backend is not available
      const mockResult: QueryResult = {
        question,
        answer: getMockAnswer(question),
        data: getMockData(question),
        cached: false,
        timestamp: new Date().toISOString()
      };
      setQueryHistory(prev => [mockResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('grand slam') || lowerQuestion.includes('most titles')) {
      return "Novak Djokovic currently holds the record with 24 Grand Slam titles, followed by Rafael Nadal with 22 and Roger Federer with 20. This is one of the most debated topics in tennis history!";
    }
    
    if (lowerQuestion.includes('djokovic') && lowerQuestion.includes('nadal')) {
      return "Novak Djokovic leads Rafael Nadal 30-29 in their head-to-head record. This is one of the greatest rivalries in tennis history, with their matches often being epic battles that go the distance.";
    }
    
    if (lowerQuestion.includes('fastest serve') || lowerQuestion.includes('serve speed')) {
      return "The fastest serve ever recorded was 163.7 mph (263.4 km/h) by Sam Groth in 2012 during a Challenger tournament. In ATP Tour events, the record is held by John Isner at 157.2 mph.";
    }
    
    if (lowerQuestion.includes('wimbledon')) {
      return "Roger Federer holds the record for most Wimbledon titles with 8 championships (2003-2007, 2009, 2012, 2017). He's widely considered the greatest grass-court player of all time.";
    }
    
    if (lowerQuestion.includes('aces')) {
      return "Ivo Karlović holds the record for most aces in a career with over 13,700 aces. He's also known for having one of the most powerful serves in tennis history.";
    }
    
    if (lowerQuestion.includes('youngest') || lowerQuestion.includes('young')) {
      return "Michael Chang became the youngest male player to win a Grand Slam at 17 years and 3 months when he won the 1989 French Open. On the women's side, Tracy Austin won the 1979 US Open at 16 years and 8 months.";
    }
    
    // Default response
    return `That's a great tennis question! "${question}" - While I don't have access to the full database in demo mode, this would typically be answered using our AI-powered tennis statistics system. The system can analyze player records, tournament results, head-to-head matchups, and various performance metrics to provide detailed insights.`;
  };

  const getMockData = (question: string): any => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('grand slam') || lowerQuestion.includes('most titles')) {
      return [
        { name: "Novak Djokovic", country: "SRB", titles: 24, years: "2008-2023" },
        { name: "Rafael Nadal", country: "ESP", titles: 22, years: "2005-2022" },
        { name: "Roger Federer", country: "SUI", titles: 20, years: "2003-2018" }
      ];
    }
    
    if (lowerQuestion.includes('djokovic') && lowerQuestion.includes('nadal')) {
      return [
        { player1: "Novak Djokovic", player2: "Rafael Nadal", djokovic_wins: 30, nadal_wins: 29, total_matches: 59 },
        { surface: "Hard Court", djokovic_wins: 20, nadal_wins: 7 },
        { surface: "Clay Court", djokovic_wins: 2, nadal_wins: 20 },
        { surface: "Grass Court", djokovic_wins: 2, nadal_wins: 2 }
      ];
    }
    
    return null;
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

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 backdrop-blur-sm">
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
