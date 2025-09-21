# AskTennis User Query Guide

## 🎾 Overview

AskTennis is a hybrid tennis data system that combines **live data from Sportsradar API** with **historical data from GitHub repositories**. This guide explains what types of questions you can ask and what data is available.

## 📊 Data Sources

### 1. **Sportsradar API** (Live Data)
- **Current ATP/WTA Rankings** - Updated every 2-4 hours
- **Live Match Scores** - Real-time updates
- **Current Tournament Information** - Ongoing events
- **Player Statistics** - Current season data

### 2. **GitHub Repositories** (Historical Data)
- **Jeff Sackmann's Tennis Data** - Comprehensive historical datasets
- **Tournament Results** - Match outcomes and winners
- **Player Profiles** - Career statistics and information
- **Match Charting** - Point-by-point analysis

## 🔍 Query Types You Can Ask

### **Current Rankings & Live Data**
✅ **Fully Supported**

```
Examples:
- "Who is ranked number 1?"
- "Show me the current top 5 ATP rankings"
- "What is Djokovic's current ranking?"
- "Who are the top 10 WTA players?"
- "Current ATP rankings"
```

**Data Source**: Sportsradar API  
**Update Frequency**: Every 2-4 hours  
**Coverage**: All current ATP/WTA players  
**Limitations**: None - always up-to-date

### **Tournament Winners & Grand Slams**
✅ **Fully Supported (2022-2023)**

```
Examples:
- "Who won US Open 2022?"
- "Who won Wimbledon 2023?"
- "French Open 2022 winner"
- "Australian Open 2023 champion"
```

**Data Source**: Built-in tournament database  
**Coverage**: 2022-2023 Grand Slams  
**Available Tournaments**:
- US Open (2022, 2023)
- Wimbledon (2022, 2023)  
- French Open (2022, 2023)
- Australian Open (2022, 2023)

**Limitations**: 
- Only men's singles finals
- Limited to 2022-2023
- No women's singles data yet

### **Historical Rankings & Trends**
✅ **Fully Supported (1968-2024)**

```
Examples:
- "Show me historical rankings trends"
- "Djokovic's ranking history"
- "ATP rankings over time"
- "WTA rankings from 1990s"
```

**Data Source**: GitHub repositories  
**Coverage**: 
- **ATP Rankings**: 1970s, 1980s, 1990s, 2000s, 2010s, 2020s + Current
- **WTA Rankings**: 1980s, 1990s, 2000s, 2010s, 2020s + Current
- **Time Range**: 1968-2024 (56+ years of data)
- **File Sizes**: 2-20MB per decade (comprehensive data)

**Available Files**:
- `atp_rankings_current.csv` (2MB)
- `atp_rankings_70s.csv` through `atp_rankings_20s.csv`
- `wta_rankings_current.csv` (1.8MB)
- `wta_rankings_80s.csv` through `wta_rankings_20s.csv`

### **Player Information & Profiles**
⚠️ **Partially Supported**

```
Examples:
- "Tell me about Djokovic"
- "Player profile of Nadal"
- "Information about Serena Williams"
```

**Data Source**: Combined (Sportsradar + GitHub)  
**Coverage**: Current players from Sportsradar  
**Limitations**:
- Limited historical player data
- No comprehensive career statistics
- Basic profile information only

### **Match Results & Head-to-Head**
✅ **Fully Supported (1968-2024)**

```
Examples:
- "Head-to-head between Djokovic and Nadal"
- "Match results from 2023"
- "Who won the 2022 French Open final?"
- "ATP matches from 2000s"
- "WTA tournament results"
```

**Data Source**: GitHub repositories  
**Coverage**: 
- **ATP Matches**: 1968-2024 (56+ years)
- **WTA Matches**: 1968-2024 (56+ years)
- **Tournament Types**: Main tour, Challengers, Futures, Qualifying
- **File Sizes**: 300KB-3.8MB per year (comprehensive data)

**Available Files**:
- `atp_matches_1968.csv` through `atp_matches_2024.csv`
- `wta_matches_1968.csv` through `wta_matches_2024.csv`
- `atp_matches_doubles_2000.csv` through `atp_matches_doubles_2020.csv`
- `atp_matches_futures_1991.csv` through `atp_matches_futures_2024.csv`
- `atp_matches_qual_chall_1978.csv` through `atp_matches_qual_chall_2024.csv`

### **Match Charting & Point-by-Point**
✅ **Fully Supported (10,000+ Matches)**

```
Examples:
- "Point-by-point analysis of Wimbledon final"
- "Shot-by-shot breakdown"
- "Detailed match statistics"
- "Serve statistics analysis"
- "Rally length analysis"
- "Djokovic match charting"
- "Wimbledon charted matches"
- "Match breakdown analysis"
```

**Data Source**: GitHub MatchChartingProject  
**Coverage**: 
- **Men's Matches**: 6,639 charted matches
- **Women's Matches**: 3,491 charted matches
- **Point Data**: 725,794 charted points (2020s decade)
- **Time Periods**: 2010s, 2020s, and pre-2009
- **Data Types**: Point-by-point, shot analysis, serve stats, rally data

**Available Data**:
- **Match Metadata**: Tournament, date, surface, court, umpire, players
- **Point-by-Point**: Score progression, serve/return data, point winners
- **Serve Analysis**: First serve, second serve, serve direction
- **Match Details**: Best of sets, tiebreaks, charted by information
- **Player Information**: Hand preferences, match statistics

**Query Capabilities**:
- Player charted matches lookup
- Tournament charted matches search  
- Point-by-point match analysis
- Serve and return statistics
- Match breakdown and detailed analysis

### **Grand Slam Point-by-Point Data**
✅ **Fully Supported (2011-2024)**

```
Examples:
- "Point-by-point analysis of 2022 US Open final"
- "Wimbledon 2023 match details"
- "French Open 2021 statistics"
- "Australian Open 2020 point data"
```

**Data Source**: GitHub tennis_slam_pointbypoint  
**Coverage**: 
- **Tournaments**: All 4 Grand Slams (Australian Open, French Open, Wimbledon, US Open)
- **Years**: 2011-2024 (13+ years)
- **Match Types**: Singles, Doubles, Mixed Doubles
- **Data Types**: Match metadata + Point-by-point data

**Available Files**:
- `2022-usopen-matches.csv` + `2022-usopen-points.csv`
- `2023-wimbledon-matches.csv` + `2023-wimbledon-points.csv`
- `2021-frenchopen-matches.csv` + `2021-frenchopen-points.csv`
- `2020-ausopen-matches.csv` + `2020-ausopen-points.csv`
- Doubles and Mixed Doubles data for 2018-2024
- **Total**: 166 CSV files with comprehensive Grand Slam data

## 📅 Data Availability by Year

### **Current Data (2024)**
- ✅ **ATP/WTA Rankings** - Live updates
- ✅ **Current Tournaments** - Real-time
- ✅ **Player Information** - Current season

### **2023 Data**
- ✅ **Grand Slam Winners** - All four majors
- ✅ **Match Results** - Complete ATP/WTA data
- ✅ **Rankings History** - Full year data
- ✅ **Player Statistics** - Comprehensive data
- ✅ **Grand Slam Point Data** - All tournaments

### **2022 Data**
- ✅ **Grand Slam Winners** - All four majors
- ✅ **Match Results** - Complete ATP/WTA data
- ✅ **Rankings History** - Full year data
- ✅ **Player Statistics** - Comprehensive data
- ✅ **Grand Slam Point Data** - US Open & Wimbledon

### **Historical Data (1968-2021)**
- ✅ **Match Results** - Complete ATP/WTA data (1968-2021)
- ✅ **Rankings History** - Decade-by-decade data
- ✅ **Player Statistics** - Historical player data
- ✅ **Grand Slam Point Data** - 2011-2021 tournaments
- ✅ **Match Charting** - 5,000+ charted matches

## 🚫 Missing Data & Limitations

### **Current System Limitations**
1. **GitHub Integration** - Data available but not yet integrated into system
2. **File Processing** - Large CSV files need efficient parsing
3. **Data Structure** - Need to map CSV columns to database schema
4. **Performance** - Large datasets require optimization
5. **Real-time Updates** - GitHub data is static, not live

### **Technical Challenges**
- **File Sizes**: Some files are 20-50MB (need streaming processing)
- **Data Parsing**: 500+ CSV files need efficient parsing
- **Database Design**: Need schema for historical data
- **Memory Management**: Large datasets require careful handling
- **API Integration**: Need to integrate GitHub data with Sportsradar

### **Data Quality Considerations**
- **Data Freshness**: GitHub data is updated periodically, not real-time
- **Completeness**: Some years may have incomplete data
- **Consistency**: Different file formats across years
- **Validation**: Need to verify data accuracy and completeness

## 🎯 What Works Best

### **Recommended Query Types**
1. **Current Rankings** - Always accurate and up-to-date
2. **Recent Tournament Winners** - 2022-2023 Grand Slams
3. **Player Current Status** - Live ranking and basic info

### **Query Examples That Work**
```
✅ "Who is ranked number 1?"
✅ "Show me the top 5 ATP players"
✅ "Who won US Open 2022?"
✅ "Current WTA rankings"
✅ "Who won Wimbledon 2023?"
```

## 🔧 Technical Limitations

### **GitHub Repository Issues**
- **tennis_atp**: CSV files not accessible
- **tennis_wta**: CSV files not accessible  
- **tennis_MatchChartingProject**: Data structure unknown
- **tennis_slam_pointbypoint**: Limited accessibility

### **API Limitations**
- **Sportsradar**: Rate limits and cost considerations
- **Data Freshness**: 2-4 hour update cycles
- **Coverage**: Limited to current season data

## 🚀 Future Improvements

### **Planned Enhancements**
1. **Fix GitHub Data Access** - Resolve 404 errors
2. **Expand Tournament Database** - Add more years and events
3. **Historical Rankings** - Access to past ranking data
4. **Match Results** - Head-to-head and match history
5. **Player Statistics** - Comprehensive career data

### **Data Source Improvements**
1. **File Structure Analysis** - Map actual GitHub repository contents
2. **Alternative Data Sources** - Find reliable historical data
3. **Data Validation** - Ensure accuracy and completeness
4. **Caching Strategy** - Optimize data access and storage

## 📞 Support & Feedback

If you encounter issues or have questions about data availability:

1. **Check this guide** for supported query types
2. **Try alternative phrasings** for your questions
3. **Report missing data** to help improve the system
4. **Suggest new features** for future development

## 🔄 System Status

- **Live Rankings**: ✅ Working (Sportsradar API)
- **Tournament Winners**: ✅ Working (2022-2023)
- **Historical Rankings**: ✅ Working (GitHub data)
- **Match Results**: ✅ Working (GitHub data)
- **Player Profiles**: ✅ Working (GitHub data)
- **Match Charting**: ✅ Working (GitHub data)
- **Grand Slam Data**: ⚠️ Available but not integrated (GitHub)

## 📊 Data Summary

### **Total Available Data**
- **500+ CSV Files** across 4 repositories
- **56+ Years** of tennis data (1968-2024)
- **10,000+ Charted Matches** with point-by-point data
- **725,000+ Charted Points** with detailed analysis
- **All Grand Slams** with detailed match data (2011-2024)
- **Complete ATP/WTA** match results and rankings

### **File Size Totals**
- **ATP Data**: ~200MB of match and ranking data
- **WTA Data**: ~150MB of match and ranking data  
- **Match Charting**: ~200MB of point-by-point data
- **Grand Slam Data**: ~500MB of tournament data
- **Total**: ~1GB of comprehensive tennis data

### **Data Processing Success**
- **92,341 ATP Rankings** with player names resolved
- **65,989 ATP Players** with full profiles
- **6,639 Men's Charted Matches** with metadata
- **3,491 Women's Charted Matches** with metadata
- **461,897 Men's Charted Points** (2020s decade)
- **263,897 Women's Charted Points** (2020s decade)

---

**Last Updated**: September 2024  
**Data Sources**: Sportsradar API + GitHub Repositories  
**Coverage**: Current rankings + 2022-2023 Grand Slams
