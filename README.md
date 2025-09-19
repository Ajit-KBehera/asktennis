# 🎾 AskTennis: AI-Powered Tennis Statistics Query System

An intelligent tennis statistics query system that allows users to ask natural language questions about tennis and receive precise, data-driven answers with beautiful visualizations.

## ✨ Features

### 🎯 **Core Functionality**
- **Natural Language Queries**: Ask questions in plain English about tennis
- **AI-Powered Responses**: Intelligent query processing with Groq's Llama models
- **Real-time Data**: Live tennis statistics and rankings
- **Beautiful UI**: Modern, responsive design inspired by AskCricinfo
- **Smart Caching**: Fast responses for common queries
- **Direct Answers**: Point-blank responses for ranking queries

### 🎨 **User Experience**
- **AskCricinfo-inspired Input**: Clean, modern input field with dynamic placeholders
- **Enhanced Data Visualization**: Beautiful ranking cards with glass-morphism effects
- **Responsive Design**: Works perfectly on desktop and mobile
- **Tennis-themed Branding**: Custom tennis ball favicon and green theme
- **Real-time Suggestions**: Helpful query suggestions as you type

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Query    │───▶│   React Frontend │───▶│   Express API   │
│ "What is the    │    │   (TypeScript)   │    │   (Node.js)     │
│ rank of Arthur  │    │                  │    │                 │
│ Fils?"          │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Beautiful     │◀───│  Query Handler   │◀───│  Groq AI API    │
│   Response      │    │  (Smart Routing) │    │  (Llama Models) │
│   + Data Cards  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  PostgreSQL DB   │
                       │  (Tennis Data)   │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Sportradar API  │
                       │  (Live Data)     │
                       └──────────────────┘
```

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript
- **Bootstrap 5** for responsive design
- **Custom CSS** with glass-morphism effects
- **Axios** for API communication

### **Backend**
- **Node.js** with Express
- **PostgreSQL** for tennis data storage
- **Groq API** with Llama 3.1-8b-instant model
- **Sportradar API** for live tennis data

### **Deployment**
- **Railway** for hosting
- **GitHub** for version control
- **Custom favicon** and PWA support

## 📊 Example Queries

### **Player Rankings**
- "What is the rank of Arthur Fils?"
- "Who is rank 1 now?"
- "Who are the top 5 players?"

### **Player Information**
- "Tell me about Carlos Alcaraz"
- "What is Novak Djokovic's ranking?"
- "Who is Jannik Sinner?"

### **Tournament Data**
- "Who won Wimbledon 2023?"
- "What are the upcoming tournaments?"
- "Show me Grand Slam winners"

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL database
- Groq API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ajit-KBehera/asktennis.git
   cd asktennis
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DATABASE_URL=your_postgresql_connection_string
   SPORTRADAR_API_KEY=your_sportradar_api_key
   ```

4. **Initialize the database**
   ```bash
   node seed.js
   ```

5. **Start the development server**
   ```bash
   # Start backend server
   npm start
   
   # In another terminal, start frontend
   cd client
   npm start
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎨 UI Components

### **QueryInput Component**
- Dynamic placeholders that change based on focus
- Real-time query suggestions
- Auto-resizing textarea
- Clean submit button with loading states

### **DataDisplay Component**
- **Ranking Cards**: Beautiful glass-morphism cards for player rankings
- **Player Info Cards**: Detailed player information display
- **Generic Tables**: Fallback for other data types
- **Responsive Design**: Adapts to different screen sizes

### **Enhanced Styling**
- Glass-morphism effects with backdrop blur
- Smooth transitions and hover effects
- Custom scrollbars
- Tennis-themed color scheme

## 📁 Project Structure

```
asktennis/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── QueryInput.tsx
│   │   │   ├── DataDisplay.tsx
│   │   │   └── ...
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   └── public/             # Static assets
├── src/                    # Backend source
│   ├── queryHandler.js     # AI query processing
│   ├── database.js         # Database connection
│   ├── dataSync.js         # Data synchronization
│   └── sportsradar.js      # API integration
├── server.js               # Express server
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔧 Configuration

### **Environment Variables**
- `GROQ_API_KEY`: Your Groq API key for AI processing
- `DATABASE_URL`: PostgreSQL connection string
- `SPORTRADAR_API_KEY`: Sportradar API key for live data
- `PORT`: Server port (default: 5000)

### **Database Schema**
The system uses PostgreSQL with tables for:
- `players`: Tennis player information
- `rankings`: Current and historical rankings
- `tournaments`: Tournament data
- `matches`: Match results and statistics

## 🚀 Deployment

### **Railway Deployment**
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy from the `main` branch
4. Your app will be available at the provided Railway URL

### **Manual Deployment**
```bash
# Build the client
cd client
npm run build
cd ..

# Start production server
npm start
```

## 🎯 Recent Updates

### **v2.0 - Enhanced UI/UX**
- ✅ AskCricinfo-inspired input field design
- ✅ Beautiful data visualization with ranking cards
- ✅ Custom tennis ball favicon and branding
- ✅ Direct, point-blank answers for ranking queries
- ✅ Fixed Arthur Fils and other player query issues
- ✅ Hidden scrollbars for cleaner appearance
- ✅ Glass-morphism effects and modern styling

### **v1.0 - Core Features**
- ✅ AI-powered query processing
- ✅ PostgreSQL database integration
- ✅ Sportradar API integration
- ✅ Responsive React frontend
- ✅ Railway deployment ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq** for fast AI inference
- **Sportradar** for comprehensive tennis data
- **Railway** for seamless deployment
- **AskCricinfo** for UI/UX inspiration

---

**Built with ❤️ for tennis fans worldwide** 🎾