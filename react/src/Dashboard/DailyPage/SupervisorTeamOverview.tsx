/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { dashboardService, SupervisorTeamOverview, LayerData } from '../../services/dashboardService';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { ProductionRole } from '@/src/types';

interface SupervisorTeamOverviewProps {
  date: string;
  productionRole: ProductionRole;
  productId: number | null | undefined;
}

const SupervisorTeamOverviewComponent: React.FC<SupervisorTeamOverviewProps> = ({ date, productionRole, productId }) => {
  const [data, setData] = useState<SupervisorTeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<number[]>([]);
  const [expandedSupervisors, setExpandedSupervisors] = useState<string[]>([]);

console.log(date, productionRole, productId)
  useEffect(() => {
    fetchData();
  }, [date, productionRole, productId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getSupervisorTeamOverview(date, productionRole, productId || 0);
      console.log(result)
      setData(result);
    } catch (error) {
      console.error('Error fetching supervisor team overview:', error);
      setError('Failed to fetch supervisor team overview');
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (layerId: number) => {
    setExpandedLayers(prev =>
      prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId]
    );
  };

  const toggleSupervisor = (supervisorName: string) => {
    setExpandedSupervisors(prev =>
      prev.includes(supervisorName) ? prev.filter(name => name !== supervisorName) : [...prev, supervisorName]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  function formatName(fullName: string | undefined | null): string {
    if (!fullName) return '';
    const names = fullName.trim().split(/\s+/);
    if (names.length <= 2) {
      return fullName;
    } else {
      return `${names[0]} ${names[names.length - 1]}`;
    }
  }
  const renderLayerSummary = (layerData: LayerData) => {
    const totalEditors = Object.values(layerData.supervisors).reduce((sum, supervisor) => sum + Object.keys(supervisor).length, 0);
    const statusCounts = Object.values(layerData.supervisors).reduce((counts, supervisor) => {
      Object.values(supervisor).forEach(editor => {
        counts[editor.status.toLowerCase()] = (counts[editor.status.toLowerCase()] || 0) + 1;
      });
      return counts;
    }, {} as Record<string, number>);

    return (
      <div className="flex items-center space-x-2">
        <Users size={16} />
        <span>{totalEditors} Editors</span>
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}>
            {count} {status}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <span className="loading loading-spinner loading-lg text-[#196A58]"></span>
    </div>;
  }

  if (error) {
    return <div className="alert bg-red-100 text-red-700 p-4 rounded-lg">
      <p>{error}</p>
    </div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      {data && Object.entries(data).map(([layerId, layerData]) => (
        <div key={layerId} className="mb-4 border rounded-lg overflow-hidden">
          <div
            className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleLayer(parseInt(layerId))}
          >
            <h3 className="font-semibold text-lg">{layerData.layerName}</h3>
            <div className="flex items-center space-x-2">
              {renderLayerSummary(layerData)}
              {expandedLayers.includes(parseInt(layerId)) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
    {expandedLayers.includes(parseInt(layerId)) && (
            <div className="p-3">
{Object.entries(layerData.supervisors).map(([supervisorName, editorData]: [string, any]) => (
                <div key={supervisorName} className="mb-2 last:mb-0">
                  <div
                    className="bg-gray-50 p-2 flex justify-between items-center cursor-pointer rounded"
                    onClick={() => toggleSupervisor(supervisorName)}
                  >
                    <h4 className="font-medium">{formatName(supervisorName)}</h4>
                    <div className="flex items-center space-x-2">
                      <span>{Object.keys(editorData).length} Editors</span>
                      {expandedSupervisors.includes(supervisorName) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {expandedSupervisors.includes(supervisorName) && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Object.entries(editorData).map(([editorName, status] : [string, any]) => (
                        <div key={editorName} className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="truncate mr-2" title={editorName}>{formatName(editorName)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(status.status)}`}>
                            {status.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SupervisorTeamOverviewComponent;