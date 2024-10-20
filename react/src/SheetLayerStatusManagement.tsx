import React, { useState, useEffect } from 'react';
import { sheetLayerStatusService, SheetLayerStatusWithDailyTargets } from './services/SheetLayerStatusService';
import { Product } from './types';
import { entityService } from './services/entityService';

const SheetLayerStatusManagement: React.FC = () => {
  const [sheetLayerStatuses, setSheetLayerStatuses] = useState<SheetLayerStatusWithDailyTargets[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productId, setProductId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<SheetLayerStatusWithDailyTargets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const completionOptions = [
    { value: 0, label: '0%' },
    { value: 0.1, label: '10%' },
    { value: 0.2, label: '20%' },
    { value: 0.3, label: '30%' },
    { value: 0.4, label: '40%' },
    { value: 0.5, label: '50%' },
    { value: 0.6, label: '60%' },
    { value: 0.7, label: '70%' },
    { value: 0.8, label: '80%' },
    { value: 0.9, label: '90%' },
    { value: 1, label: '100%' },
  ];

  const booleanOptions = [
    { value: true, label: 'In Progress' },
    { value: false, label: 'Completed' },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const productsData = await entityService.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    }
  };

  const searchSheetLayerStatuses = async () => {
    if (searchTerm.trim() === '') return;
    setLoading(true);
    setSelectedStatus(null);
    setHasSearched(true);
    try {
      const statuses = await sheetLayerStatusService.searchSheetLayerStatusesAcrossLayers(searchTerm.trim(), productId);
      setSheetLayerStatuses(statuses);
      setError(null);
    } catch (error) {
      console.error('Error fetching sheet layer statuses:', error);
      setSheetLayerStatuses([]);
      setError('Failed to fetch sheet layer statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSelect = (status: SheetLayerStatusWithDailyTargets) => {
    setSelectedStatus(status);
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus) {
      setLoading(true);
      try {
        await sheetLayerStatusService.updateSheetLayerStatus(selectedStatus.sheetLayerStatus.id, selectedStatus.sheetLayerStatus);
        await searchSheetLayerStatuses();
        setSelectedStatus(null);
      } catch (error) {
        console.error('Error updating sheet layer status:', error);
        setError('Failed to update sheet layer status');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto p-6 bg-white rounded-lg shadow-lg">
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-6 flex space-x-2">
        <input
          type="text"
          placeholder="Search sheets..."
          className="flex-grow p-2 border border-gray-300 focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="w-1/3 p-2 border border-gray-300 focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50 rounded"
          value={productId || ''}
          onChange={(e) => setProductId(e.target.value ? parseInt(e.target.value) : null)}
        >
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
        <button
          onClick={searchSheetLayerStatuses}
          disabled={loading}
          className="bg-[#196A58] text-white py-2 px-4 rounded hover:bg-[#196A58]/90 focus:outline-none focus:ring-2 focus:ring-[#196A58] focus:ring-opacity-50 transition duration-200 ease-in-out"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sheet Layer Status List */}
        <div className="w-full lg:w-1/3">
          <h2 className="text-xl font-semibold mb-3 text-[#196A58]">Search Results</h2>
          <div className="bg-gray-100 p-4 rounded-lg overflow-y-auto max-h-[600px]">
            {sheetLayerStatuses.map(status => (
              <div
                key={status.sheetLayerStatus.id}
                className={`flex justify-between items-center p-3 mb-2 rounded-lg cursor-pointer transition duration-200 ease-in-out ${
                  selectedStatus?.sheetLayerStatus.id === status.sheetLayerStatus.id
                    ? 'bg-[#196A58] text-white'
                    : 'bg-white hover:bg-gray-200'
                }`}
                onClick={() => handleStatusSelect(status)}
              >
                <div>
                  <p className="font-medium">{status.sheet.sheetName}</p>
                  <p className="text-sm">{status.layer.name}</p>
                  <p className="text-sm">Delivery: {status.sheet.deliveryNumber}</p>
                </div>
                <div className="text-sm font-semibold">
                  {(status.sheetLayerStatus.completion * 100).toFixed(0)}%
                </div>
              </div>
            ))}
             {hasSearched && sheetLayerStatuses.length === 0 && !loading && (
              <p className="text-center text-gray-500 mt-4">No results found</p>
            )}
          </div>
        </div>


        {/* Status Details and Update Form */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-xl font-semibold mb-3 text-[#196A58]">
            {selectedStatus ? `Update Status: ${selectedStatus.sheet.sheetName} - ${selectedStatus.layer.name}` : 'Select a status to update'}
          </h2>
          {selectedStatus && (
            <div className="bg-[#196A58]/5 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                    value={selectedStatus.sheetLayerStatus.inProgress.toString()}
                    onChange={(e) => setSelectedStatus({
                      ...selectedStatus,
                      sheetLayerStatus: {
                        ...selectedStatus.sheetLayerStatus,
                        inProgress: e.target.value === 'true'
                      }
                    })}
                  >
                    {booleanOptions.map(option => (
                      <option key={option.value.toString()} value={option.value.toString()}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Percentage</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                    value={selectedStatus.sheetLayerStatus.completion}
                    onChange={(e) => setSelectedStatus({
                      ...selectedStatus,
                      sheetLayerStatus: {
                        ...selectedStatus.sheetLayerStatus,
                        completion: parseFloat(e.target.value)
                      }
                    })}
                  >
                    {completionOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily QC Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                    value={selectedStatus.sheetLayerStatus.isQCInProgress.toString()}
                    onChange={(e) => setSelectedStatus({
                      ...selectedStatus,
                      sheetLayerStatus: {
                        ...selectedStatus.sheetLayerStatus,
                        isQCInProgress: e.target.value === 'true'
                      }
                    })}
                  >
                    {booleanOptions.map(option => (
                      <option key={option.value.toString()} value={option.value.toString()}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final QC Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                    value={selectedStatus.sheetLayerStatus.isFinalQCInProgress.toString()}
                    onChange={(e) => setSelectedStatus({
                      ...selectedStatus,
                      sheetLayerStatus: {
                        ...selectedStatus.sheetLayerStatus,
                        isFinalQCInProgress: e.target.value === 'true'
                      }
                    })}
                  >
                    {booleanOptions.map(option => (
                      <option key={option.value.toString()} value={option.value.toString()}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className="w-full mt-6 bg-[#196A58] text-white py-2 px-4 rounded-md hover:bg-[#196A58]/90 focus:outline-none focus:ring-2 focus:ring-[#196A58] focus:ring-opacity-50 transition duration-200 ease-in-out"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          )}

          {/* Daily Target Information */}
          {selectedStatus && selectedStatus.dailyTargets.length > 0 && (
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStatus.dailyTargets.map((target, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow">
                    <p><strong>Production Role:</strong> {target.productionRole}</p>
                    <p><strong>Employee:</strong> {target.employeeName}</p>
                    <p><strong>Taqnia ID:</strong> {target.taqniaID}</p>
                    <p><strong>Date:</strong> {new Date(target.productivityDate || '').toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SheetLayerStatusManagement;