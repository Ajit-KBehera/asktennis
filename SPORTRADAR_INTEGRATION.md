# Sportsradar Integration Guide

This document explains how to set up and use the Sportsradar API integration for live tennis data in AskTennis.

## 🎯 Overview

The Sportsradar integration provides:
- **Live ATP/WTA Rankings** - Updated daily
- **Current Tournaments** - Real-time tournament information
- **Player Profiles** - Detailed player statistics
- **Match Results** - Live match data and statistics
- **Automatic Data Sync** - Scheduled updates every 24 hours

## 🔧 Setup

### 1. Get Sportsradar API Key

1. Visit [Sportsradar Developer Portal](https://sportradar.com/developers/)
2. Sign up for a free trial account
3. Subscribe to the Tennis API
4. Copy your API key

### 2. Configure Environment Variables

Add your API key to your `.env` file:

```bash
# Sportsradar Configuration
SPORTRADAR_API_KEY=your_actual_sportsradar_api_key_here
```

**Important**: Replace `your_actual_sportsradar_api_key_here` with your real API key.

### 3. Test the Integration

Run the test script to verify everything is working:

```bash
node test-sportsradar.js
```

This will test:
- ✅ API key configuration
- ✅ API connection
- ✅ Database connection
- ✅ Data synchronization
- ✅ Database queries

## 🚀 Usage

### Automatic Data Sync

Once configured, the system automatically:
- Syncs data every 24 hours
- Updates player rankings
- Refreshes tournament information
- Maintains data freshness

### Manual Data Sync

You can manually trigger data sync via API:

```bash
# Force immediate sync
curl -X POST http://localhost:5000/api/sync/force

# Check sync status
curl http://localhost:5000/api/sync/status

# Test API connection
curl http://localhost:5000/api/sync/test
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync/status` | GET | Get sync status and last update time |
| `/api/sync/force` | POST | Force immediate data synchronization |
| `/api/sync/test` | GET | Test Sportsradar API connection |

## 📊 Data Structure

### Players Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255) UNIQUE)
- country (VARCHAR(3))
- current_ranking (INTEGER)
- tour (VARCHAR(10)) -- 'ATP' or 'WTA'
- birth_date, height, weight, etc.
- created_at, updated_at
```

### Rankings Table
```sql
- id (SERIAL PRIMARY KEY)
- player_id (INTEGER REFERENCES players(id))
- ranking (INTEGER)
- points (INTEGER)
- tour (VARCHAR(10))
- ranking_date (DATE)
- created_at
```

### Tournaments Table
```sql
- id (VARCHAR(50) PRIMARY KEY)
- name (VARCHAR(255))
- type, surface, level, location
- start_date, end_date, prize_money
- status, current_round
- created_at, updated_at
```

## 🔄 Data Flow

1. **API Fetch**: Sportsradar API provides live tennis data
2. **Data Processing**: Raw data is processed and normalized
3. **Database Update**: Data is upserted into PostgreSQL
4. **Query Processing**: AI queries use live data instead of static data
5. **Response Generation**: Users get current, accurate information

## 🛠️ Troubleshooting

### Common Issues

#### 1. API Key Not Working
```
Error: Sportsradar API key not configured
```
**Solution**: Check your `.env` file and ensure `SPORTRADAR_API_KEY` is set correctly.

#### 2. API Rate Limits
```
Error: API request failed with status: 429
```
**Solution**: Sportsradar has rate limits. The system handles this automatically with retries.

#### 3. Database Connection Issues
```
Error: Database connection failed
```
**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is configured.

#### 4. No Data Returned
```
Warning: API connected but no data returned
```
**Solution**: Check if the API endpoint is correct and your subscription is active.

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.SPORTRADAR_API_KEY ? 'Configured' : 'Not configured')"

# Test database connection
node -e "require('./src/database').connect().then(() => console.log('DB OK')).catch(console.error)"

# Check sync status
curl http://localhost:5000/api/sync/status
```

## 📈 Monitoring

### Sync Status
The system provides detailed sync status:

```json
{
  "success": true,
  "isRunning": false,
  "lastSync": "2024-01-15T10:30:00.000Z",
  "isSportsradarAvailable": true,
  "nextSyncIn": 82800000
}
```

### Logs
Monitor the console for sync activity:
```
🔄 Starting data synchronization with Sportsradar...
📊 Updated 150 player rankings
🏆 Updated 25 tournaments
✅ Data synchronization completed successfully
```

## 🔒 Security

- API keys are stored in environment variables
- No sensitive data is logged
- Rate limiting prevents API abuse
- Database connections use connection pooling

## 📝 Notes

- **Trial Limits**: Free trial accounts have limited API calls per day
- **Data Freshness**: Rankings are updated daily, matches in real-time
- **Fallback Mode**: If Sportsradar is unavailable, the system falls back to static data
- **Performance**: Data is cached and queries are optimized for speed

## 🆘 Support

If you encounter issues:

1. Run the test script: `node test-sportsradar.js`
2. Check the logs for error messages
3. Verify your API key is correct
4. Ensure your Sportsradar subscription is active
5. Check the [Sportsradar Documentation](https://sportradar.com/developers/)

## 🎉 Success!

Once configured, your AskTennis application will have:
- ✅ Live tennis data from Sportsradar
- ✅ Automatic daily updates
- ✅ Current player rankings
- ✅ Real-time tournament information
- ✅ Accurate, up-to-date answers to tennis questions

Your users will now get factual, current information instead of outdated static data!
