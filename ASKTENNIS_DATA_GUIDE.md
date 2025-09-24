# AskTennis Data Guide 🎾

## Overview
AskTennis is a comprehensive tennis statistics and data query system that combines live data from Sportsradar API with historical data from Jeff Sackmann's GitHub repositories. Users can ask natural language questions about tennis and get intelligent, data-driven responses.

## 🚀 Access Your AskTennis App
- **Web Interface**: http://132.145.160.185:3000
- **API Endpoint**: http://132.145.160.185:3000/api/query

---

## 📊 Available Data Categories

### 1. **Current Rankings & Player Information**

#### **ATP Rankings**
- Current world number 1: Novak Djokovic
- Top 10, 20, 50, 100 players
- Ranking points and positions
- Ranking history and changes

**Example Queries:**
- "Who is the current world number 1 in tennis?"
- "Who are the top 5 ATP players?"
- "What is Novak Djokovic's current ranking?"
- "Who is ranked number 2 in the world?"

#### **WTA Rankings**
- Current women's world number 1
- Top women's players
- WTA ranking points and positions

**Example Queries:**
- "Who is the current women's world number 1?"
- "Who are the top 10 WTA players?"
- "What is Iga Swiatek's ranking?"

### 2. **Tournament Results & Winners**

#### **Grand Slam Tournaments**
- **Wimbledon 2022**: Novak Djokovic
- **US Open 2022**: Carlos Alcaraz
- **French Open 2022**: Rafael Nadal
- **Australian Open 2022**: Rafael Nadal

**Example Queries:**
- "Who won Wimbledon 2022?"
- "Who won the US Open 2022?"
- "Who won the French Open 2022?"
- "Who won the Australian Open 2022?"
- "Who won the French Open 2023?"

#### **Other Tournaments**
- ATP Masters 1000 events
- ATP 500 and 250 tournaments
- WTA Premier and International events
- Olympic tennis results

**Example Queries:**
- "Who won the Miami Open 2022?"
- "Who won the Indian Wells Masters?"
- "Who won the Olympics tennis gold medal?"

### 3. **Head-to-Head Records**

#### **Player vs Player Statistics**
- Match records between specific players
- Win/loss ratios
- Recent meetings and results
- Historical head-to-head data

**Example Queries:**
- "What is the head-to-head between Djokovic and Nadal?"
- "How many times has Federer beaten Djokovic?"
- "What is the record between Serena Williams and Venus Williams?"
- "Who has won more matches: Djokovic or Federer?"

### 4. **Match Results & Statistics**

#### **Recent Matches**
- Latest match results
- Match scores and statistics
- Tournament match outcomes
- Grand Slam match results

**Example Queries:**
- "What was the result of the latest Djokovic match?"
- "Who won the Wimbledon 2022 final?"
- "What was the score of the US Open 2022 final?"
- "Who won the French Open 2022 final?"

#### **Match Statistics**
- Service statistics (aces, double faults)
- Return statistics
- Break point conversions
- Set and game statistics

**Example Queries:**
- "How many aces did Djokovic serve in his last match?"
- "What was the longest match at Wimbledon 2022?"
- "Who had the most aces in the US Open 2022?"

### 5. **Historical Data & Records**

#### **Career Statistics**
- Career win/loss records
- Grand Slam titles
- Masters 1000 titles
- Career earnings
- Years active

**Example Queries:**
- "How many Grand Slam titles does Djokovic have?"
- "Who has won the most Wimbledon titles?"
- "What is Roger Federer's career win percentage?"
- "Who has the most ATP Masters 1000 titles?"

#### **Historical Rankings**
- Past world number 1 players
- Ranking history by year
- Longest time at number 1
- Ranking milestones

**Example Queries:**
- "Who was world number 1 in 2020?"
- "How long was Federer world number 1?"
- "Who was the youngest world number 1?"
- "Who held the number 1 ranking the longest?"

### 6. **Tournament Information**

#### **Tournament Details**
- Tournament dates and locations
- Prize money and points
- Tournament categories (Grand Slam, Masters, etc.)
- Surface types (hard, clay, grass)

**Example Queries:**
- "When is Wimbledon 2023?"
- "What surface is the French Open played on?"
- "How much prize money does the US Open winner get?"
- "What is the difference between ATP and WTA tournaments?"

#### **Tournament History**
- Past winners by year
- Tournament records and milestones
- Multiple winners
- Tournament statistics

**Example Queries:**
- "Who has won the most French Open titles?"
- "Who won Wimbledon in 2019?"
- "What is the record for most consecutive Wimbledon wins?"
- "Who won the US Open in 2020?"

---

## 🔍 Query Types Supported

### **Natural Language Queries**
The system understands natural language questions and can process:
- **Who questions**: "Who is the current world number 1?"
- **What questions**: "What is Djokovic's ranking?"
- **When questions**: "When did Federer win his last Grand Slam?"
- **How many questions**: "How many Grand Slam titles does Nadal have?"
- **Compare questions**: "Who is better: Djokovic or Federer?"

### **Specific Data Queries**
- **Rankings**: Current and historical player rankings
- **Tournaments**: Winners, results, and statistics
- **Matches**: Head-to-head records and recent results
- **Statistics**: Career stats and achievements
- **Records**: Milestones and achievements

---

## 📱 How to Use AskTennis

### **Web Interface**
1. Go to: http://132.145.160.185:3000
2. Type your question in the input field
3. Click "Ask Question"
4. Get instant tennis data responses

### **API Usage**
```bash
curl -X POST http://132.145.160.185:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Who is the current world number 1 in tennis?"}'
```

### **Programming Integration**
```javascript
// JavaScript example
fetch('http://132.145.160.185:3000/api/query', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: 'Who won Wimbledon 2022?'})
})
.then(res => res.json())
.then(data => console.log(data));
```

```python
# Python example
import requests

response = requests.post('http://132.145.160.185:3000/api/query', 
  json={'query': 'Who are the top 5 ATP players?'})
print(response.json())
```

---

## 🎯 Sample Queries to Try

### **Current Rankings**
- "Who is the current world number 1 in tennis?"
- "Who are the top 5 ATP players?"
- "Who is ranked number 2 in the world?"
- "What is Carlos Alcaraz's current ranking?"

### **Tournament Winners**
- "Who won Wimbledon 2022?"
- "Who won the US Open 2022?"
- "Who won the French Open 2022?"
- "Who won the Australian Open 2022?"

### **Head-to-Head Records**
- "What is the head-to-head between Djokovic and Nadal?"
- "How many times has Federer beaten Djokovic?"
- "Who has won more matches: Djokovic or Federer?"

### **Career Statistics**
- "How many Grand Slam titles does Djokovic have?"
- "Who has won the most Wimbledon titles?"
- "What is Roger Federer's career win percentage?"

### **Historical Data**
- "Who was world number 1 in 2020?"
- "Who won Wimbledon in 2019?"
- "Who was the youngest world number 1?"

---

## 🔧 Technical Details

### **Data Sources**
- **Live Data**: Sportsradar API for current rankings and matches
- **Historical Data**: Jeff Sackmann's GitHub repositories
- **Hybrid System**: Combines live and historical data intelligently

### **Response Format**
```json
{
  "query": "Who is the current world number 1 in tennis?",
  "answer": "Based on the latest ATP rankings, the current world number 1 is Novak Djokovic.",
  "timestamp": "2025-09-24T00:47:38.488Z",
  "source": "AskTennis AI System"
}
```

### **Data Coverage**
- **Time Range**: 2000-2024 (comprehensive historical data)
- **Tournaments**: All major tournaments and Grand Slams
- **Players**: Top 1000+ players in rankings
- **Matches**: 100,000+ match results
- **Statistics**: Comprehensive player and match statistics

---

## 🚀 Future Enhancements

### **Planned Features**
- Real-time match updates
- Advanced statistics and analytics
- Player comparison tools
- Tournament prediction models
- Mobile app integration

### **Data Expansion**
- More historical data (pre-2000)
- Doubles rankings and results
- Junior and ITF tournament data
- Player injury and retirement information

---

## 📞 Support

For questions about data availability or query capabilities, the AskTennis system is designed to handle a wide range of tennis-related questions. The AI system will provide the most accurate and up-to-date information available from the integrated data sources.

**Your AskTennis system is now live and ready to answer tennis questions!** 🎾✨
