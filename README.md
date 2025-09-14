# 🎾 AskTennis: AI-Powered Tennis Statistics Query System

An AI-powered tennis statistics query system similar to ESPN Cricinfo's AskCricinfo, allowing users to ask natural language questions about tennis and receive precise statistical answers.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Query    │───▶│   Frontend UI    │───▶│   NLP Engine    │
│ "Who has most   │    │ (React/Next.js)  │    │ (GPT-3/4 +      │
│  aces in Grand  │    │                  │    │  Custom Parser) │
│  Slam finals?"  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Response      │◀───│  Query Executor  │◀───│  SQL Generator  │
│ Generation      │    │                  │    │                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Tennis Database │
                       │  (PostgreSQL +   │
                       │   Redis Cache)   │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  External APIs   │
                       │  (Sportradar,    │
                       │   SportsDataIO)  │
                       └──────────────────┘
```

## 🎯 Key Features

- **Natural Language Queries**: Ask questions in plain English
- **Comprehensive Tennis Data**: ATP, WTA, Grand Slams, and more
- **Real-time Updates**: Live match data and statistics
- **Voice Input**: Speak your questions naturally
- **Smart Caching**: Fast responses for common queries
- **Mobile Responsive**: Works on all devices

## 📊 Example Queries

1. **Player Statistics**: "Who has the most aces in Grand Slam finals?"
2. **Head-to-Head**: "What is Novak Djokovic's record against Rafael Nadal?"
3. **Tournament Records**: "Who has won the most Wimbledon titles?"
4. **Performance Metrics**: "Which player has the highest first serve percentage in 2023?"
5. **Historical Data**: "Who was the youngest player to win a Grand Slam?"
6. **Surface Analysis**: "Who has the best record on clay courts?"
7. **Ranking Queries**: "How long did Roger Federer hold the #1 ranking?"

## 🛠️ Technology Stack

### Backend
- **Node.js/Express** - API server
- **Python** - Data processing and ML models
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **WebSockets** - Real-time updates

### Frontend
- **React/Next.js** - User interface
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

### AI/ML
- **Groq Cloud API** - Fast inference with Llama models
- **Custom Tennis Parser** - Domain-specific understanding
- **Query Optimization** - Performance tuning

### Infrastructure
- **AWS/Google Cloud** - Hosting and scaling
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **CDN** - Global content delivery

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## 📈 Data Sources

- **Sportradar Tennis API** - Comprehensive ATP/WTA coverage
- **SportsDataIO Tennis API** - Real-time scores and statistics
- **API-Tennis.com** - Tournament and fixture data
- **Entity Digital Sports** - Player statistics and live scores

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

This project is licensed under the MIT License.
