import React from 'react';
import { motion } from 'framer-motion';

interface DataDisplayProps {
  data: any[];
  queryType?: string;
}

// Animation variants for DataDisplay
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
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
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
    scale: 1.05,
    y: -8,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  },
  hover: {
    scale: 1.01,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  }
};

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

  // Render ranking data with special styling
  if (isRankingData) {
    return (
      <motion.div 
        className="data-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="d-flex justify-content-between align-items-center mb-3"
          variants={itemVariants}
        >
          <h6 className="text-primary mb-0 heading-4">
            <motion.i 
              className="bi bi-trophy me-2 text-warning"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            ></motion.i>
            Rankings
          </h6>
          <motion.span 
            className="badge bg-primary"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {data.length} {data.length === 1 ? 'Player' : 'Players'}
          </motion.span>
        </motion.div>
        
        <motion.div 
          className="row g-3"
          variants={containerVariants}
        >
          {data.slice(0, 10).map((player, index) => (
            <motion.div 
              key={index} 
              className="col-12 col-md-6 col-lg-4"
              variants={itemVariants}
            >
              <motion.div 
                className="ranking-card"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="ranking-header">
                  <motion.div 
                    className="ranking-number"
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    #{player.ranking}
                  </motion.div>
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
                  <motion.div 
                    className="ranking-date"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <i className="bi bi-calendar3 me-1"></i>
                    {formatValue('ranking_date', player.ranking_date)}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        
        {data.length > 10 && (
          <motion.div 
            className="text-center mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <small className="text-white-50">
              Showing top 10 of {data.length} players
            </small>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Render player data with card layout
  if (isPlayerData && data.length <= 5) {
    return (
      <motion.div 
        className="data-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="d-flex justify-content-between align-items-center mb-3"
          variants={itemVariants}
        >
          <h6 className="text-primary mb-0 heading-4">
            <motion.i 
              className="bi bi-person me-2 text-info"
              animate={{ 
                scale: [1, 1.1, 1],
                color: ['var(--color-info)', '#20c997', 'var(--color-info)']
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            ></motion.i>
            Player Information
          </h6>
          <motion.span 
            className="badge bg-info"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {data.length} {data.length === 1 ? 'Player' : 'Players'}
          </motion.span>
        </motion.div>
        
        <motion.div 
          className="row g-3"
          variants={containerVariants}
        >
          {data.map((player, index) => (
            <motion.div 
              key={index} 
              className="col-12"
              variants={itemVariants}
            >
              <motion.div 
                className="player-card"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="player-header">
                  <h5 className="player-name mb-2">{player.name}</h5>
                  <div className="player-badges">
                    {player.current_ranking && (
                      <motion.span 
                        className="badge bg-primary me-2"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        Rank #{player.current_ranking}
                      </motion.span>
                    )}
                    {player.country && (
                      <motion.span 
                        className="badge bg-secondary me-2"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {player.country}
                      </motion.span>
                    )}
                    {player.tour && (
                      <motion.span 
                        className="badge bg-success"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {player.tour}
                      </motion.span>
                    )}
                  </div>
                </div>
                
                <motion.div 
                  className="player-details-grid"
                  variants={containerVariants}
                >
                  {Object.entries(player).map(([key, value]) => {
                    if (key === 'name' || !value) return null;
                    return (
                      <motion.div 
                        key={key} 
                        className="detail-item"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <span className="detail-label">{getFieldName(key)}</span>
                        <span className="detail-value">{formatValue(key, value)}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // Default table view for other data types
  return (
    <motion.div 
      className="data-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="d-flex justify-content-between align-items-center mb-3"
        variants={itemVariants}
      >
        <h6 className="text-primary mb-0 heading-4">
          <motion.i 
            className="bi bi-table me-2 text-success"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          ></motion.i>
          Data
        </h6>
        <motion.span 
          className="badge bg-success"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {data.length} {data.length === 1 ? 'Record' : 'Records'}
        </motion.span>
      </motion.div>
      
      <motion.div 
        className="enhanced-table-container"
        variants={itemVariants}
      >
        <div className="table-responsive">
          <table className="table enhanced-table">
            <motion.thead
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <tr>
                {Object.keys(data[0]).map((key, index) => (
                  <motion.th 
                    key={index} 
                    className="table-header"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <i className="bi bi-arrow-down-up me-1"></i>
                    {getFieldName(key)}
                  </motion.th>
                ))}
              </tr>
            </motion.thead>
            <motion.tbody
              variants={containerVariants}
            >
              {data.slice(0, 10).map((row: any, index: number) => (
                <motion.tr 
                  key={index} 
                  className="table-row"
                  variants={tableRowVariants}
                  whileHover="hover"
                >
                  {Object.entries(row).map(([key, value], cellIndex: number) => (
                    <motion.td 
                      key={cellIndex} 
                      className="table-cell"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.05 + cellIndex * 0.02 }}
                    >
                      <span className="cell-content">
                        {formatValue(key, value)}
                      </span>
                    </motion.td>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        
        {data.length > 10 && (
          <motion.div 
            className="text-center mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <small className="text-white-50">
              Showing first 10 of {data.length} records
            </small>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DataDisplay;
