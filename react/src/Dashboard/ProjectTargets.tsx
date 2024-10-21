/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Layers, Download, FileText } from 'lucide-react';
import { dashboardService, ProjectTargetsResponse } from '../services/dashboardService';
import { entityService } from '../services/entityService';
import { Product } from '../types';

const DELIVERY_NUMBERS = [1, 2 , 3 , 4 , 5 ,6 , 7]
const DELIVERY_DATE = '2024-12-10'; // Hard-coded delivery date

const AUTHORIZED_USER_IDS = [4850, 4591, 4592, 4720, 4804, 4805, 4841, 3, 4414, 5035];

const ProjectTargets: React.FC = () => {
    const [projectTargets, setProjectTargets] = useState<ProjectTargetsResponse | null>(null);
    const [completedSheetsCount, setCompletedSheetsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<number>(3);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProductId) {
            fetchData(selectedProductId);
        }
    }, [selectedProductId, selectedDelivery]);

    const fetchProducts = async () => {
        try {
            const fetchedProducts = await entityService.getAllProducts();
            setProducts(fetchedProducts);
            if (fetchedProducts.length > 0) {
                setSelectedProductId(fetchedProducts[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setError('Failed to fetch products');
        }
    };

    const fetchData = async (productId: number) => {
        try {
            setLoading(true);
            const [targets, sheetsCount] = await Promise.all([
                dashboardService.getProjectTargets(selectedDelivery, productId),
                dashboardService.getCompletedSheetsCount(productId, selectedDelivery)
            ]);
            setProjectTargets(targets);
            setCompletedSheetsCount(sheetsCount);
            setLoading(false);
            const userJson = localStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                setIsAuthorized(AUTHORIZED_USER_IDS.includes(user));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProductId = parseInt(e.target.value);
        setSelectedProductId(newProductId);
    };


    const calculateProgress = (completed: number, total: number) => {
        return total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;
    };

    const calculateTimeRemaining = (deliveryDate: string) => {
        const now = new Date();
        const delivery = new Date(deliveryDate);
        const timeRemaining = delivery.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeRemaining / (1000 * 3600 * 24));
        return daysRemaining > 0 ? `${daysRemaining} days` : '0';
    };

    const handleDownloadExcel = async () => {
        try {
            const blob = await dashboardService.downloadCompletedSheetsExcel();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CompletedSheets_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel file:', error);
            setError('Failed to download Excel file');
        }
    };

    const handleDownloadExcelAll = async () => {
        try {
            const blob = await dashboardService.downloadCompletedSheetStatusesExcel();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CompletedSheetStatuses_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading Excel file:', error);
            setError('Failed to download Excel file');
        }
    };  const handleSelectChange = (e : any) => {
        setSelectedDelivery(e.target.value);
      };
    
      const ProgressBar: React.FC<{ value: number; total: number; color: string }> = ({ value, total }) => (
        <div className="w-full bg-white rounded-full shadow-lg h-2 mt-1">
            <div
                className={`bg-[#196A58] h-2 rounded-full transition-all duration-500`}
                style={{ width: `${calculateProgress(value, total)}%` }}
            ></div>
        </div>
    );

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-[#196A58]"></span>
            </div>
        );
    if (error) return <div className="alert alert-error">{error}</div>;

    return (
        <div className="container mx-auto ">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div style={{ backgroundImage: `url(makanBackgroundDark.png)` }} className="p-4">
                    <h3 className="text-2xl font-bold text-white flex items-center justify-between">
                        <span>Delivery         <select
      className='text-green-800 rounded-lg ml-2'
      value={selectedDelivery} // Controlled value
      onChange={handleSelectChange} // Update state on change
    >
      {DELIVERY_NUMBERS.map((number) => (
        <option key={number} value={number}>
          {number}
        </option>
      ))}
    </select></span>
                    
                        <div className="flex items-center">
                            <select
                                id="product-select"
                                value={selectedProductId || ''}
                                onChange={handleProductChange}
                                className="px-2 py-1 border border-gray-300 rounded-md text-sm mr-4 text-[#196A58]"
                            >
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleDownloadExcelAll}
                                className="text-[#196A58] text-sm p-1 rounded-md flex items-center hover:bg-[#196A58] transition-colors duration-300"
                            >
                                <Download className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </h3>
                </div>
                <div className="p-4">
                    <div className={`grid grid-cols-1 ${isAuthorized ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-6`}>
                        <div style={{ backgroundImage: `url(makanBackgroundDark.png)` }} className="text-center p-3 rounded-lg">
                            <div className="text-sm mb-2 text-white">Delivery Date</div>
                            <Calendar className="w-8 h-8 text-white mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">
                                {new Date(DELIVERY_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                        {isAuthorized && (
                            <div
                                style={{ backgroundImage: `url(makanBackgroundDark.png)` }}
                                className="text-center p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity duration-300"
                                onClick={handleDownloadExcel}
                            >
                                <div className="text-sm mb-2 text-white">Sheets Completed</div>
                                <FileText className="w-8 h-8 text-white mx-auto mb-2" />
                                <div className="text-lg font-bold text-white flex items-center justify-center">
                                    {completedSheetsCount}
                                    <Download className="w-4 h-4 ml-2 text-white" />
                                </div>
                            </div>
                        )}
                        <div style={{ backgroundImage: `url(makanBackgroundDark.png)` }} className="text-center p-3 rounded-lg">
                            <div className="text-sm mb-2 text-white">Time Remaining</div>
                            <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">
                                {calculateTimeRemaining(DELIVERY_DATE)}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {projectTargets?.layerData.map((layer) => (
                    <div key={layer.layerId} className="bg-[#F0F7F5]/70 shadow-md p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center text-lg font-semibold text-[#196A58]">
                                <Layers className="w-3 h-3 mr-2 font-bold text-[#196A58]" /> {layer.layerName}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#196A58]">Production:</span>
                                    <span className="font-semibold text-[#196A58]">{layer.completedSheetCount} / {layer.totalSheets} Sheets</span>
                                </div>
                                <ProgressBar value={layer.completedSheetCount} total={layer.totalSheets} color="bg-blue-500" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#196A58]">QC:</span>
                                    <span className="font-semibold text-[#196A58]">{layer.completedQCCount} / {layer.totalSheets} Sheets</span>
                                </div>
                                <ProgressBar value={layer.completedQCCount} total={layer.totalSheets} color="bg-green-500" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#196A58]">Finalized QC:</span>
                                    <span className="font-semibold text-[#196A58]">{layer.completedFinalizedQCCount} / {layer.totalSheets} Sheets</span>
                                </div>
                                <ProgressBar value={layer.completedFinalizedQCCount} total={layer.totalSheets} color="bg-yellow-500" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#196A58]">Final QC:</span>
                                    <span className="font-semibold text-[#196A58]">{layer.completedFinalQCCount} / {layer.totalSheets} Sheets</span>
                                </div>
                                <ProgressBar value={layer.completedFinalQCCount} total={layer.totalSheets} color="bg-red-500" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTargets;