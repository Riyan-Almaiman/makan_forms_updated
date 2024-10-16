import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { WeeklyTargetWithActual } from '../../services/dashboardService';

interface WeeklyPerformanceChartProps {
  selectedTarget: WeeklyTargetWithActual;
}

const WeeklyPerformanceChart: React.FC<WeeklyPerformanceChartProps> = ({ selectedTarget }) => {
  if (!selectedTarget || !selectedTarget.weeklyActuals) {
    console.error("Invalid or missing data for WeeklyPerformanceChart:", selectedTarget);
    return <div>No data available for weekly performance chart</div>;
  }

  const formatDateRange = (startDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } catch (error) {
      console.error("Error formatting date range:", error);
      return "Invalid Date";
    }
  };

  const chartData = selectedTarget.weeklyActuals
    .map(week => ({
      weekRange: formatDateRange(week.weekStart),
      actual: week.actualAmount,
      target: selectedTarget.weeklyTargetAmount,
      hardCodedValue: 220,
    }))
    .sort((a, b) => new Date(a.weekRange.split(' - ')[0]).getTime() - new Date(b.weekRange.split(' - ')[0]).getTime());

  console.log("WeeklyPerformanceChart data:", chartData);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 mt-2 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-[#196A58] mb-4">
        Previous 5 weeks Performance {selectedTarget.layerName}
      </h3>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekRange" />
            <YAxis label={{ value: 'Sheets', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="linear" dataKey="actual" name="Productivity" stroke="#196A58" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyPerformanceChart;