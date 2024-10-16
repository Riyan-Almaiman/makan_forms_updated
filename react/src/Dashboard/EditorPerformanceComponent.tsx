import React, { useState, useEffect } from 'react';
import { dashboardService, EditorPerformanceResponse } from '../services/dashboardService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const EditorPerformanceComponent: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<EditorPerformanceResponse | null>(null);
  const [filteredData, setFilteredData] = useState<EditorPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaqniaId, setSelectedTaqniaId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
  const [daysToShow, setDaysToShow] = useState(7);

  useEffect(() => {
    if (selectedTaqniaId) {
      fetchData(selectedTaqniaId);
    }
  }, [selectedTaqniaId]);

  useEffect(() => {
    if (performanceData) {
      filterData();
    }
  }, [performanceData, daysToShow]);

  const fetchData = async (taqniaId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.GetEditorPerformance(taqniaId);
      setPerformanceData(data);
    } catch (err) {
      setError('Failed to fetch editor performance data');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (!performanceData) return;
    const filteredPerformanceData = performanceData.performanceData.slice(-daysToShow);
    setFilteredData({
      ...performanceData,
      performanceData: filteredPerformanceData
    });
  };

  const toggleRowExpansion = (date: string) => {
    setExpandedRows(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedTaqniaId(value);
  };

  const chartData = filteredData?.performanceData.map(day => ({
    date: day.date,
    productivity: day.totalProductivity,
    hoursWorked: day.totalHoursWorked
  })) || [];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-[#196A58] mb-4">{filteredData?.editorName}</h3>
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <input
              type="number"
              value={selectedTaqniaId || ''}
              onChange={handleInputChange}
              placeholder="Enter Taqnia ID"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="flex items-center">
            <Filter className="mr-2 text-[#196A58]" size={16} />
            <select
              value={daysToShow}
              onChange={(e) => setDaysToShow(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg text-[#196A58]"></span>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && filteredData && (
        <>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="productivity" stroke="#196A58" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="hoursWorked" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-[#196A58] text-white">
                  <th className="py-3 px-4 text-left"></th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Total Hours</th>
                  <th className="py-3 px-4 text-left">Total Productivity</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.performanceData.map((day, index) => (
                  <React.Fragment key={day.date}>
                    <tr className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4">
                        <button onClick={() => toggleRowExpansion(day.date)} className="text-[#196A58] hover:text-[#0D4D3D] transition-colors">
                          {expandedRows[day.date] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="py-2 px-4 flex items-center">
                        <Calendar className="mr-2 text-[#196A58]" size={16} />
                        {day.date}
                      </td>
                      <td className="py-2 px-4">{day.productName || 'No data'}</td>
                      <td className="py-2 px-4">{day.totalHoursWorked.toFixed(2)}</td>
                      <td className="py-2 px-4">{day.totalProductivity.toFixed(2)}</td>
                    </tr>
                    {expandedRows[day.date] && (
                      <tr>
                        <td colSpan={5} className="py-2 px-4">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Layer</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Type</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productivity</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Productivity</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sheet Number</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.dailyTargets.map((target, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className="py-2 px-3 text-sm">{target.layerName || 'N/A'}</td>
                                  <td className="py-2 px-3 text-sm">{target.hoursWorked.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-sm">{target.productivity.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-sm">{target.expectedProductivity?.toFixed(2) || 'N/A'}</td>
                                  <td className="py-2 px-3 text-sm">{target.remarkName || 'N/A'}</td>
                                  <td className="py-2 px-3 text-sm">{target.sheetNumber || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !filteredData && !error && (
        <div className="text-center text-gray-500 mt-8">
          Select an editor to view performance data.
        </div>
      )}
    </div>
  );
};

export default EditorPerformanceComponent;