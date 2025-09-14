import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-tennis-dark text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl">🎾</div>
              <h3 className="text-xl font-bold">AskTennis</h3>
            </div>
            <p className="text-gray-300">
              AI-powered tennis statistics query system. Ask questions in natural language 
              and get precise statistical answers about tennis players, tournaments, and matches.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#examples" className="hover:text-white transition-colors">
                  Example Queries
                </a>
              </li>
              <li>
                <a href="#api" className="hover:text-white transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#github" className="hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Data Sources</h4>
            <ul className="space-y-2 text-gray-300">
              <li>ATP Tour</li>
              <li>WTA Tour</li>
              <li>Grand Slam Tournaments</li>
              <li>Masters Series</li>
              <li>Live Match Data</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 AskTennis. Built with ❤️ for tennis fans worldwide.</p>
          <p className="mt-2 text-sm">
            Powered by Groq Cloud API and comprehensive tennis databases.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
