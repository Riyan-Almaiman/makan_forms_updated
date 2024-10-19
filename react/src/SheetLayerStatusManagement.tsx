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

  useEffect(() => {
    searchSheetLayerStatuses();
  }, [searchTerm, productId]);

  const fetchProducts = async () => {
    try {
      const productsData = await entityService.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const searchSheetLayerStatuses = async () => {
    if (searchTerm.trim() === '') {
      setSheetLayerStatuses([]);
      return;
    }
    setSelectedStatus(null);  
    try {
      const statuses = await sheetLayerStatusService.searchSheetLayerStatusesAcrossLayers(searchTerm, productId);
      setSheetLayerStatuses(statuses);
      setError(null);
    } catch (error) {
      console.error('Error fetching sheet layer statuses:', error);
      setSheetLayerStatuses([]);
      setError('Failed to fetch sheet layer statuses');
    }
  };

  const handleStatusSelect = (status: SheetLayerStatusWithDailyTargets) => {
    setSelectedStatus(status);
  };

  const handleProductionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inProgress = e.target.value === 'true';
    setSelectedStatus(prevStatus => {
      if (prevStatus) {
        return {
          ...prevStatus,
          sheetLayerStatus: {
            ...prevStatus.sheetLayerStatus,
            inProgress: inProgress,
            completion: inProgress ? prevStatus.sheetLayerStatus.completion : 1
          }
        };
      }
      return prevStatus;
    });
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus) {
      try {
        await sheetLayerStatusService.updateSheetLayerStatus(selectedStatus.sheetLayerStatus.id, selectedStatus.sheetLayerStatus);
        searchSheetLayerStatuses(); // Refresh the list
        setSelectedStatus(null);
      } catch (error) {
        console.error('Error updating sheet layer status:', error);
        setError('Failed to update sheet layer status');
      }
    }
  };

  return (
    <div className="mx-auto p-4 bg-white rounded-lg shadow-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          placeholder="Search sheets..."
          className="flex-grow p-2 border focus:border-[#196A58] rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="w-1/3 p-2 border focus:border-[#196A58] rounded"
          value={productId || ''}
          onChange={(e) => setProductId(e.target.value ? parseInt(e.target.value) : null)}
        >
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sheet Layer Status List */}
        <div className="w-full md:w-1/4">
          <div className="bg-gray-100 p-2 rounded-lg overflow-y-auto">
            {sheetLayerStatuses.map(status => (
              <div
                key={status.sheetLayerStatus.id}
                className={`flex justify-between items-center p-3 mb-2 rounded-lg cursor-pointer ${
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
                <div className="text-sm">
                  Completion: {status.sheetLayerStatus.completion * 100}%
                </div>
              </div>
            ))}
            {sheetLayerStatuses.length === 0 && searchTerm.trim() !== '' && (
              <p className="text-center text-gray-500 mt-4">No results found</p>
            )}
          </div>
        </div>

        {/* Status Details and Update Form */}
        <div className="w-full md:w-2/4">
          <h3 className="text-lg font-semibold mb-2">
            {selectedStatus ? `Update Status: ${selectedStatus.sheet.sheetName} - ${selectedStatus.layer.name}` : ''}
          </h3>
          {selectedStatus && (
            <div className="bg-[#196A58]/15 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Production</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                  value={selectedStatus.sheetLayerStatus.inProgress.toString()}
                  onChange={handleProductionChange}
                >
                  {booleanOptions.map(option => (
                    <option key={option.value.toString()} value={option.value.toString()}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Sheet Completion Percentage</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Daily QC</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Final QC</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Finalized QC</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                  value={selectedStatus.sheetLayerStatus.isFinalizedQCInProgress.toString()}
                  onChange={(e) => setSelectedStatus({
                    ...selectedStatus,
                    sheetLayerStatus: {
                      ...selectedStatus.sheetLayerStatus,
                      isFinalizedQCInProgress: e.target.value === 'true'
                    }
                  })}
                >
                  {booleanOptions.map(option => (
                    <option key={option.value.toString()} value={option.value.toString()}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Daily Target Information */}
        
              <button
                onClick={handleStatusUpdate}
                className="w-full mt-4 bg-[#196A58] text-white py-2 px-4 rounded-md hover:bg-[#196A58]/90 focus:outline-none focus:ring-2 focus:ring-[#196A58] focus:ring-opacity-50"
              >
                Update Status
              </button>
            </div>
          )}

        </div>        <div className="w-full md:w-1/4 flex-row">
        {selectedStatus && selectedStatus.dailyTargets.length > 0 &&  (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Daily Targets</h4>
                  {selectedStatus.dailyTargets.map((target, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-green-800 last:border-b-0">
                      <p>Production Role: {target.productionRole}</p>
                      <p>Employee: {target.employeeName}</p>
                      <p>Taqnia ID: {target.taqniaID}</p>
                      <p>Productivity Date: {new Date(target.productivityDate || '').toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

          </div>
      </div>
    </div>
  );
};

export default SheetLayerStatusManagement;