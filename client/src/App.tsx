import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ThemeProvider } from './contexts/ThemeContext';
import QueryInput from './components/QueryInput';
import LoadingSpinner from './components/LoadingSpinner';
import DataDisplay from './components/DataDisplay';
import ThemeToggle from './components/ThemeToggle';

interface QueryResult {
  question: string;
  answer: string;
  data: any;
  cached: boolean;
  timestamp: string;
  queryType?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.5
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  }
};

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
    <ThemeProvider>
      <motion.div 
        className="min-vh-100 d-flex flex-column" 
        style={{background: 'var(--bg-primary)'}}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <ThemeToggle />
      {/* Modern Header */}
      <motion.header 
        className="py-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 text-center">
              <motion.h1 
                className="heading-1 text-primary mb-0"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.span 
                  className="me-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🎾
                </motion.span>
                AskTennis
              </motion.h1>
              <motion.p 
                className="body-large text-secondary mt-2"
                variants={itemVariants}
              >
                Your AI-powered tennis statistics assistant
              </motion.p>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Main Content */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8 col-xl-6">
              {/* Input Card - AskCricinfo Style */}
              <motion.div 
                className="input-card card-modern" 
                style={{
                  padding: 'var(--space-8)'
                }}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <QueryInput onQuery={handleQuery} isLoading={isLoading} />
              </motion.div>

              {/* Loading Spinner */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    className="text-center mt-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LoadingSpinner />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Response Display */}
              <AnimatePresence mode="wait">
                {currentResponse && !isLoading && (
                  <motion.div 
                    className="mt-4"
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 100, 
                      damping: 15,
                      duration: 0.5 
                    }}
                  >
                    <motion.div 
                      className="card card-modern shadow-glass" 
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: 'var(--shadow-glass-hover)'
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="card-body p-4">
                        <motion.div 
                          className="d-flex justify-content-between align-items-center mb-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h5 className="card-title mb-0 text-primary">
                            <motion.i 
                              className="bi bi-chat-dots me-2"
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                            ></motion.i>
                            Your Question
                          </h5>
                          <small className="text-muted">
                            {new Date(currentResponse.timestamp).toLocaleTimeString()}
                          </small>
                        </motion.div>
                        
                        <motion.div 
                          className="alert alert-light border-0 mb-3" 
                          style={{background: 'rgba(0,123,255,0.1)'}}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <p className="mb-0 fw-medium">{currentResponse.question}</p>
                        </motion.div>
                        
                        <motion.h6 
                          className="text-primary mb-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.i 
                            className="bi bi-lightbulb me-2"
                            animate={{ 
                              color: ['var(--color-warning)', '#ffed4e', 'var(--color-warning)'],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          ></motion.i>
                          Answer
                        </motion.h6>
                        
                        <motion.div 
                          className="alert alert-success border-0 mb-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <p className="mb-0">{currentResponse.answer}</p>
                        </motion.div>

                        {/* Enhanced Data Display */}
                        {currentResponse.data && currentResponse.data.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <DataDisplay 
                              data={currentResponse.data} 
                              queryType={currentResponse.queryType}
                            />
                          </motion.div>
                        )}

                        {/* Clear Response Button */}
                        <motion.div 
                          className="text-center mt-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          <motion.button 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setCurrentResponse(null)}
                            whileHover={{ 
                              scale: 1.05,
                              backgroundColor: 'rgba(108, 117, 125, 0.2)'
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <i className="bi bi-x-circle me-2"></i>
                            Clear Response
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="py-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <motion.p 
                className="text-muted mb-0 body-small"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                © 2025 AskTennis - Powered by AI & Sportsradar API
              </motion.p>
            </div>
          </div>
        </div>
      </motion.footer>
      </motion.div>
    </ThemeProvider>
  );
}

export default App;
