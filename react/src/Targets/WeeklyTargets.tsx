import React, { useState, useEffect } from "react";
import { entityService } from "../services/entityService";
import { weeklyTargetService } from "../services/weeklyTargetService";
import { Layer, Product, ProductionRole, WeeklyTarget } from "../types";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

const WeeklyTargets: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [selectedProductionRole, setSelectedProductionRole] = useState<ProductionRole>(ProductionRole.Production);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [currentTarget, setCurrentTarget] = useState<WeeklyTarget | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchLayers();
  }, []);

  useEffect(() => {
    updateWeekDates();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedProduct && selectedLayer && selectedProductionRole) {
      fetchWeeklyTarget();
    }
  }, [selectedProduct, selectedLayer, selectedProductionRole, selectedDate]);

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await entityService.getAllProducts();
      setProducts(fetchedProducts);
      if (fetchedProducts.length > 0) {
        setSelectedProduct(fetchedProducts[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to fetch products");
    }
  };

  const fetchLayers = async () => {
    try {
      const fetchedLayers = await entityService.getAllLayers();
      setLayers(fetchedLayers);
      if (fetchedLayers.length > 0) {
        setSelectedLayer(fetchedLayers[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch layers:", err);
      setError("Failed to fetch layers");
    }
  };

  const getWeekStartDate = (date: Date): Date => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  };

  const getWeekDates = (weekStartDate: Date): Date[] => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStartDate);
      date.setUTCDate(weekStartDate.getUTCDate() + i);
      return date;
    });
  };

  const updateWeekDates = () => {
    const weekStartDate = getWeekStartDate(selectedDate);
    const dates = getWeekDates(weekStartDate);
    setWeekDates(dates);
  };

  const fetchWeeklyTarget = async () => {
    if (!selectedProduct || !selectedProductionRole || !selectedLayer) return;
    setIsLoading(true);
    try {
      const weekStartDate = getWeekStartDate(selectedDate);
      const weekStart = weekStartDate.toISOString().split('T')[0];
      const fetchedTargets = await weeklyTargetService.getWeeklyTargetsByProductRoleAndWeek(
        selectedProduct,
        selectedProductionRole,
        weekStart
      );
      const targetForSelected = fetchedTargets.find(t => 
        t.productId === selectedProduct &&
        t.productionRole === selectedProductionRole &&
        t.layerId === selectedLayer
      );
      setCurrentTarget(targetForSelected || createEmptyTarget());
    } catch (err) {
      console.error("Error fetching weekly target:", err);
      setError("Failed to fetch weekly target");
    } finally {
      setIsLoading(false);
    }
  };


  const createEmptyTarget = (): WeeklyTarget => ({
    productId: selectedProduct!,
    layerId: selectedLayer!,
    productionRole: selectedProductionRole!,
    weekStart: getWeekStartDate(selectedDate).toISOString().split('T')[0],
    mondayAmount: null,
    tuesdayAmount: null,
    wednesdayAmount: null,
    thursdayAmount: null,
    fridayAmount: null,
    saturdayAmount: null,
    sundayAmount: null,
    amount: 0,
  });


  const handleTargetChange = (date: Date, value: string) => {
    if (!currentTarget) return;
    const dayKey = getDayKey(date);
    const numericValue = value === '' ? null : parseFloat(value);
    setCurrentTarget(prev => ({
      ...prev!,
      [dayKey]: numericValue
    }));
  };


  const handleSave = async () => {
    if (!currentTarget || !selectedProduct || !selectedProductionRole || !selectedLayer) return;
    setIsLoading(true);
    try {
      const targetToSave = {
        ...currentTarget,
        productId: selectedProduct,
        productionRole: selectedProductionRole,
        layerId: selectedLayer,
      };
      console.log('Saving target:', targetToSave); // For debugging
      const updatedTarget = await weeklyTargetService.createOrUpdateWeeklyTarget(targetToSave);
      setCurrentTarget(updatedTarget);
      setError("Weekly target saved successfully");
    } catch (err) {
      console.error("Failed to save weekly target:", err);
      setError("Failed to save weekly target");
    } finally {
      setIsLoading(false);
    }
    setTimeout(() => setError(null), 3000);
  };

  const getDayKey = (date: Date): keyof WeeklyTarget => {
    const days = ['sundayAmount', 'mondayAmount', 'tuesdayAmount', 'wednesdayAmount', 'thursdayAmount', 'fridayAmount', 'saturdayAmount'];
    return days[date.getUTCDay()] as keyof WeeklyTarget;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };



  return (
    <div className=" w-full">
      <div className=" p-6 rounded-lg bg-[#e6f0ee]">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-12">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <button
                  className="p-2 rounded-full bg-[#196A58] text-white hover:bg-[#124C3F] transition duration-300"
                  onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600">
                  {weekDates.length > 0 && `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`}
                </span>
                <button
                  className="p-2 rounded-full bg-[#196A58] text-white hover:bg-[#124C3F] transition duration-300"
                  onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-white p-6  rounded-lg shadow">
  <div className="mb-4">
    <h2 className="text-lg font-semibold mb-2 text-gray-700">Product</h2>
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#196A58] focus:border-[#196A58]"
      value={selectedProduct || ''}
      onChange={(e) => setSelectedProduct(Number(e.target.value))}
    >
      <option value="" disabled>Select a product</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>{product.name}</option>
      ))}
    </select>
  </div>

  <div className="mb-4">
    <h2 className="text-lg font-semibold mb-2 text-gray-700">Production Role</h2>
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#196A58] focus:border-[#196A58]"
      value={selectedProductionRole || ''}
      onChange={(e) => setSelectedProductionRole(e.target.value as ProductionRole)}
    >
      <option value="" disabled>Select a role</option>
      {Object.values(ProductionRole).map((role) => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  </div>

  <div>
    <h2 className="text-lg font-semibold mb-2 text-gray-700">Layer</h2>
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#196A58] focus:border-[#196A58]"
      value={selectedLayer || ''}
      onChange={(e) => setSelectedLayer(Number(e.target.value))}
    >
      <option value="" disabled>Select a layer</option>
      {layers.map((layer) => (
        <option key={layer.id} value={layer.id}>{layer.name}</option>
      ))}
    </select>
  </div>
</div>

          </div>
  
          <div className="lg:col-span-2">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#196A58]"></div>
              </div>
            )}
  
            {error && (
              <div className={`p-4 mb-4 rounded-md ${error.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {error}
              </div>
            )}
  
  {selectedProduct && selectedProductionRole && selectedLayer && currentTarget ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {products.find(p => p.id === selectedProduct)?.name} - 
            {layers.find(l => l.id === selectedLayer)?.name} - 
            {selectedProductionRole}
          </h2>
          <div className="space-y-4">
            {weekDates.map((date, index) => {
              const dayKey = getDayKey(date);
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-24">{formatDate(date)}</span>
                  <input
                    type="number"
                    className="w-full ml-4 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-[#196A58] focus:border-[#196A58]"
                    value={currentTarget[dayKey] ?? ''}
                    onChange={(e) => handleTargetChange(date, e.target.value)}
                  />
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600 w-24">Total</span>
              <span className="w-full ml-4 px-3 py-2 text-sm font-bold text-gray-900 bg-[#e6f0ee] rounded-md">
                {currentTarget.amount?.toFixed(2) ?? '0.00'}
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className="px-6 py-2 bg-[#196A58] text-white rounded-md hover:bg-[#124C3F] transition duration-300 flex items-center"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 bg-white p-6 rounded-lg shadow">
            Please select a product, production role, and layer to view and manage weekly targets.
          </div>
        </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTargets;