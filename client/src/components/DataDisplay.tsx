import React from 'react';

interface DataDisplayProps {
  data: any[];
  queryType?: string;
}

const DataDisplay: React.FC<DataDisplayProps> = ({ data, queryType }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Format values based on their type and content
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    const stringValue = String(value);
    
    // Format numbers with commas
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toLocaleString();
    }
    
    // Format currency
    if (key.toLowerCase().includes('prize') || key.toLowerCase().includes('money') || key.toLowerCase().includes('earnings')) {
      return `$${value.toLocaleString()}`;
    }
    
    // Format dates
    if (key.toLowerCase().includes('date') && stringValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(stringValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Format ranking
    if (key.toLowerCase().includes('ranking') || key.toLowerCase().includes('rank')) {
      return `#${value}`;
    }
    
    // Format points
    if (key.toLowerCase().includes('points')) {
      return value.toLocaleString();
    }
    
    return stringValue;
  };

  // Get field display name
  const getFieldName = (key: string) => {
    const fieldNames: { [key: string]: string } = {
      'name': 'Player',
      'ranking': 'Rank',
      'points': 'Points',
      'ranking_date': 'Date',
      'country': 'Country',
      'country_code': 'Country',
      'current_ranking': 'Current Rank',
      'tour': 'Tour',
      'birth_date': 'Birth Date',
      'height': 'Height',
      'weight': 'Weight',
      'playing_hand': 'Playing Hand',
      'handedness': 'Handedness',
      'turned_pro': 'Turned Pro',
      'pro_year': 'Pro Year',
      'career_prize_money': 'Career Prize Money',
      'highest_singles_ranking': 'Career High',
      'highest_singles_ranking_date': 'Career High Date',
      'gender': 'Gender',
      'abbreviation': 'Abbreviation',
      'nationality': 'Nationality'
    };
    
    return fieldNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if this is ranking data
  const isRankingData = data.some(item => item.ranking !== undefined);
  const isPlayerData = data.some(item => item.name && (item.country || item.current_ranking));
  const isTournamentData = data.some(item => item.tournament_name || item.competition_name);

  // Render ranking data with special styling
  if (isRankingData) {
    return (
      <div className="data-section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-white mb-0">
            <i className="bi bi-trophy me-2 text-warning"></i>
            Rankings
          </h6>
          <span className="badge bg-primary">
            {data.length} {data.length === 1 ? 'Player' : 'Players'}
          </span>
        </div>
        
        <div className="row g-3">
          {data.slice(0, 10).map((player, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <div className="ranking-card">
                <div className="ranking-header">
                  <div className="ranking-number">
                    #{player.ranking}
                  </div>
                  <div className="ranking-info">
                    <h6 className="player-name mb-1">{player.name}</h6>
                    <div className="player-details">
                      <span className="country-flag me-2">
                        {player.country_code || player.country}
                      </span>
                      <span className="points">
                        {formatValue('points', player.points)} pts
                      </span>
                    </div>
                  </div>
                </div>
                {player.ranking_date && (
                  <div className="ranking-date">
                    <i className="bi bi-calendar3 me-1"></i>
                    {formatValue('ranking_date', player.ranking_date)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {data.length > 10 && (
          <div className="text-center mt-3">
            <small className="text-white-50">
              Showing top 10 of {data.length} players
            </small>
          </div>
        )}
      </div>
    );
  }

  // Render player data with card layout
  if (isPlayerData && data.length <= 5) {
    return (
      <div className="data-section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-white mb-0">
            <i className="bi bi-person me-2 text-info"></i>
            Player Information
          </h6>
          <span className="badge bg-info">
            {data.length} {data.length === 1 ? 'Player' : 'Players'}
          </span>
        </div>
        
        <div className="row g-3">
          {data.map((player, index) => (
            <div key={index} className="col-12">
              <div className="player-card">
                <div className="player-header">
                  <h5 className="player-name mb-2">{player.name}</h5>
                  <div className="player-badges">
                    {player.current_ranking && (
                      <span className="badge bg-primary me-2">
                        Rank #{player.current_ranking}
                      </span>
                    )}
                    {player.country && (
                      <span className="badge bg-secondary me-2">
                        {player.country}
                      </span>
                    )}
                    {player.tour && (
                      <span className="badge bg-success">
                        {player.tour}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="player-details-grid">
                  {Object.entries(player).map(([key, value]) => {
                    if (key === 'name' || !value) return null;
                    return (
                      <div key={key} className="detail-item">
                        <span className="detail-label">{getFieldName(key)}</span>
                        <span className="detail-value">{formatValue(key, value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default table view for other data types
  return (
    <div className="data-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-white mb-0">
          <i className="bi bi-table me-2 text-success"></i>
          Data
        </h6>
        <span className="badge bg-success">
          {data.length} {data.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>
      
      <div className="enhanced-table-container">
        <div className="table-responsive">
          <table className="table enhanced-table">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key, index) => (
                  <th key={index} className="table-header">
                    <i className="bi bi-arrow-down-up me-1"></i>
                    {getFieldName(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row: any, index: number) => (
                <tr key={index} className="table-row">
                  {Object.entries(row).map(([key, value], cellIndex: number) => (
                    <td key={cellIndex} className="table-cell">
                      <span className="cell-content">
                        {formatValue(key, value)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length > 10 && (
          <div className="text-center mt-3">
            <small className="text-white-50">
              Showing first 10 of {data.length} records
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDisplay;
