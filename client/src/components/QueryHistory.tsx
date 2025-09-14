import React from 'react';

interface QueryResult {
  question: string;
  answer: string;
  data: any;
  cached: boolean;
  timestamp: string;
}

interface QueryHistoryProps {
  history: QueryResult[];
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ history }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatData = (data: any) => {
    if (!data || !Array.isArray(data)) return null;
    
    if (data.length === 0) return null;
    
    // If it's a simple array of objects, display as a table
    if (typeof data[0] === 'object' && data[0] !== null) {
      const keys = Object.keys(data[0]);
      
      return (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {keys.map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((row, index) => (
                <tr key={index}>
                  {keys.map((key) => (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing first 10 results of {data.length} total
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No queries yet. Ask your first tennis question above!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((result, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-tennis-dark mb-2">
                {result.question}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatTimestamp(result.timestamp)}</span>
                {result.cached && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Cached
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 leading-relaxed">
                {result.answer}
              </p>
            </div>
            
            {formatData(result.data)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueryHistory;
