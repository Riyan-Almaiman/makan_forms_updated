import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { WeeklyTargetWithActual } from '../../services/dashboardService';

interface DailyPerformanceChartProps {
  selectedTarget: WeeklyTargetWithActual;
}

const DailyPerformanceChart: React.FC<DailyPerformanceChartProps> = ({ selectedTarget }) => {
  if (!selectedTarget || !selectedTarget.dailyActuals) {
    console.error("Invalid or missing data for DailyPerformanceChart:", selectedTarget);
    return <div>No data available for daily performance chart</div>;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const chartData = selectedTarget.dailyActuals
    .map(day => ({
      date: formatDate(day.date),
      actual: day.actualAmount,
      target: day.target,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log("DailyPerformanceChart data:", chartData);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 mt-2 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-[#196A58] mb-4">
        {selectedTarget.layerName} - Week of {formatDate(selectedTarget.weekStart)}
      </h3>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Sheets', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="linear" 
              dataKey="target" 
              name="Daily Target" 
              stroke="#FFA500" 
              strokeWidth={1}
              dot={{ stroke: '#FFA500', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="linear" 
              dataKey="actual" 
              name="Achieved Sheets" 
              stroke="#196A58" 
              strokeWidth={3}
              dot={{ stroke: '#196A58', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8 }}
              z={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyPerformanceChart;