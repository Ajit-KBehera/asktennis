import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import QueryInput from './components/QueryInput';
import LoadingSpinner from './components/LoadingSpinner';
import DataDisplay from './components/DataDisplay';

interface QueryResult {
  question: string;
  answer: string;
  data: any;
  cached: boolean;
  timestamp: string;
  queryType?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<QueryResult | null>(null);

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
      setCurrentResponse(result);
      
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
      console.log('Mock result:', mockResult);
      setCurrentResponse(mockResult);
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


  return (
    <div className="min-vh-100 d-flex flex-column" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Modern Header */}
      <header className="py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 text-center">
              <h1 className="display-3 fw-bold text-white mb-0">
                <span className="me-3">🎾</span>AskTennis
              </h1>
              <p className="lead text-white-50 mt-2">
                Your AI-powered tennis statistics assistant
              </p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8 col-xl-6">
              {/* Input Card - AskCricinfo Style */}
              <div className="input-card" style={{
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                padding: '2rem'
              }}>
                <QueryInput onQuery={handleQuery} isLoading={isLoading} />
              </div>

              {/* Loading Spinner */}
              {isLoading && (
                <div className="text-center mt-4">
                  <LoadingSpinner />
                </div>
              )}

              {/* Response Display */}
              {currentResponse && !isLoading && (
                <div className="mt-4">
                  <div className="card shadow-lg border-0" style={{
                    borderRadius: '20px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0 text-white">
                          <i className="bi bi-chat-dots me-2"></i>
                          Your Question
                        </h5>
                        <small className="text-white-50">
                          {new Date(currentResponse.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                      <div className="alert alert-light border-0 mb-3" style={{background: 'rgba(0,123,255,0.1)'}}>
                        <p className="mb-0 fw-medium">{currentResponse.question}</p>
                      </div>
                      
                      <h6 className="text-white mb-3">
                        <i className="bi bi-lightbulb me-2"></i>
                        Answer
                      </h6>
                      <div className="alert alert-success border-0 mb-3">
                        <p className="mb-0">{currentResponse.answer}</p>
                      </div>

                      {/* Enhanced Data Display */}
                      {currentResponse.data && currentResponse.data.length > 0 && (
                        <DataDisplay 
                          data={currentResponse.data} 
                          queryType={currentResponse.queryType}
                        />
                      )}

                      {/* Clear Response Button */}
                      <div className="text-center mt-4">
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setCurrentResponse(null)}
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Clear Response
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <p className="text-white-50 mb-0 small">
                © 2025 AskTennis - Powered by AI & Sportsradar API
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
