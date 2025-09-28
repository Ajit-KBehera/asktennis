# 🎾 Best Working Queries for AskTennis Railway Deployment

## Overview
This document contains the **best working queries** that are optimized for the Sportradar trial limitations and your Railway-hosted AskTennis application.

## ✅ **Recommended Queries for Trial Users**

### **1. Current Rankings**
- `"Who is ranked number 1 in tennis?"`
- `"What is the current ranking of Novak Djokovic?"`
- `"Show me the top 10 players"`
- `"Who are the top 5 tennis players?"`
- `"What rank is Carlos Alcaraz?"`
- `"Who is the current world number 1?"`
- `"Show me the ATP rankings"`
- `"What is the ranking of Rafael Nadal?"`

### **2. Tournament Information**
- `"What tournaments are happening now?"`
- `"Show me current tennis competitions"`
- `"What are the upcoming tournaments?"`
- `"What tournaments are scheduled this week?"`
- `"Tell me about tennis venues"`
- `"Where is Wimbledon played?"`
- `"What stadium hosts the US Open?"`

### **3. Live Match Data**
- `"What matches are happening today?"`
- `"Show me live tennis matches"`
- `"What's the current tennis schedule?"`
- `"Are there any ongoing tournaments?"`
- `"What matches are live right now?"`
- `"Show me today's tennis matches"`

### **4. Race Rankings**
- `"Show me the race to London rankings"`
- `"Who is leading the race rankings?"`
- `"What are the race rankings?"`

### **5. Doubles Rankings**
- `"Show me doubles rankings"`
- `"Who are the top doubles teams?"`
- `"What are the doubles rankings?"`

### **6. Player Information**
- `"Tell me about Roger Federer"`
- `"Who is Jannik Sinner?"`
- `"What is the ranking of Serena Williams?"`
- `"Show me information about Carlos Alcaraz"`

## 🚫 **Queries to Avoid (Trial Limitations)**

### **Historical Data (Limited Access)**
- ❌ `"Who won Wimbledon 2023?"`
- ❌ `"What happened at the French Open final?"`
- ❌ `"Show me tennis results from 2021"`
- ❌ `"Who won the Australian Open last year?"`

### **Detailed Statistics (Limited Access)**
- ❌ `"Who has the most aces?"`
- ❌ `"Best first serve percentage"`
- ❌ `"Who has the highest win rate?"`
- ❌ `"Most double faults in tennis"`

### **Career Records (Limited Access)**
- ❌ `"Who has the most Grand Slam titles?"`
- ❌ `"What is Novak Djokovic's career prize money?"`
- ❌ `"Who has earned the most prize money?"`

## 🔧 **Technical Notes**

### **Available Sportradar Trial Endpoints:**
```
✅ /rankings.json                    // ATP Rankings
✅ /rankings.json                    // WTA Rankings  
✅ /competitions.json                // Current tournaments
✅ /schedules/live/summaries.json    // Live matches
✅ /schedules/summaries.json         // Upcoming matches
✅ /race_rankings.json               // Race rankings
✅ /double_competitors_rankings.json // Doubles rankings
✅ /complexes.json                   // Venue information
```

### **Rate Limits (Trial)**
- Lower request limits compared to production
- Slower response times due to rate limiting
- Limited concurrent requests

### **Fallback System**
Your app has a fallback system that uses static tennis data when Sportradar is unavailable, so users can still ask basic questions about:
- Basic player information
- Historical tournament winners (from static data)
- General tennis knowledge

## 🎯 **Best Practices for Users**

1. **Focus on current/real-time queries** that work well with trial limitations
2. **Use specific player names** for better results
3. **Ask about rankings and current tournaments** for best performance
4. **Avoid historical or detailed statistical queries** during trial period

## 🚀 **Quick Test Queries**

Try these queries to test your Railway deployment:

1. `"Who is ranked number 1 in tennis?"`
2. `"Show me the top 5 players"`
3. `"What tournaments are happening now?"`
4. `"What matches are live today?"`
5. `"Tell me about tennis venues"`

---

**Note:** This document is optimized for the Sportradar trial limitations and your current Railway deployment configuration.
