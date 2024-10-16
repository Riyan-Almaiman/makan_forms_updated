import React, { useEffect, useState } from "react";
import { weeklyTargetService } from "../../services/weeklyTargetService";
import { WeeklyTarget, Product, Layer, ProductionRole } from "../../types";
import {
  ArrowUpCircle,
  Target,
  Layers,
  ChevronLeft,
  ChevronRight,

} from "lucide-react";
import { entityService } from "../../services/entityService";
import {
  dashboardService,
  WeeklyTargetWithActual,
} from "../../services/dashboardService";
import WeeklyPerformanceChart from "./WeeklyPerformanceChart";
import DailyPerformanceChart from "./DailyPerformanceChart";

const WeeklyStatsComponent: React.FC = () => {
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>([]);
  const [weeklyTargetsWithActuals, setWeeklyTargetsWithActuals] = useState<WeeklyTargetWithActual[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedTargetData, setSelectedTargetData] = useState<WeeklyTargetWithActual | null>(null);
  const [selectedProductionRole, setSelectedProductionRole] = useState<ProductionRole | null>(ProductionRole.Production);

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getWeekRange = (date: Date) => {
    const weekStart = getStartOfWeek(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
    };
  };

  const formatDateRange = (start: string, end: string): string => {
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
  
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
  
    return `${formattedStart} to ${formattedEnd}`;
  };

  useEffect(() => {
    fetchProducts();
    fetchLayers();
  }, []);

  useEffect(() => {
    console.log("Effect triggered. Selected Product:", selectedProduct, "Selected Role:", selectedProductionRole);
    setSelectedTargetData(null);
    const newWeekRange = getWeekRange(selectedDate);
    setWeekRange(newWeekRange);
    if (selectedProduct && selectedProductionRole) {
      console.log("Fetching data for:", selectedProduct, selectedProductionRole, newWeekRange);
      fetchWeeklyTargets(newWeekRange.start);
      fetchWeeklyTargetsWithActuals(
        newWeekRange.start,
        newWeekRange.end,
        selectedProduct,
        selectedProductionRole
      );
    }
  }, [selectedDate, selectedProduct, selectedProductionRole]);

  const fetchLayers = async () => {
    try {
      const fetchedLayers = await entityService.getAllLayers();
      setLayers(fetchedLayers);
    } catch (err) {
      console.error("Failed to fetch layers:", err);
      setError("Failed to fetch layers");
    }
  };

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

  const fetchWeeklyTargets = async (weekStart: string) => {
    console.log("fetching weekly targets");
    if (!selectedProduct || !selectedProductionRole) return;
    setIsLoading(true);
    try {
      const fetchedTargets = await weeklyTargetService.getWeeklyTargetsByProductRoleAndWeek(
        selectedProduct,
        selectedProductionRole,
        weekStart
      );
      console.log(fetchedTargets);
      setWeeklyTargets(fetchedTargets);
    } catch (err) {
      console.error("Error fetching weekly targets:", err);
      setError("Failed to fetch weekly targets");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchWeeklyTargetsWithActuals = async (
    startDate: string,
    endDate: string,
    productId: number,
    productionRole: ProductionRole
  ) => {
    console.log("Fetching weekly targets with actuals", { startDate, endDate, productId, productionRole });
    setIsLoading(true);
    try {
      const data = await dashboardService.GetWeeklyTargetsWithActuals(
        startDate,
        endDate,
        productId,
        productionRole
      );
      console.log("Fetched weekly targets with actuals:", data);
      if (Array.isArray(data) && data.length > 0) {
        setWeeklyTargetsWithActuals(data);
        setSelectedTargetData(data[0]);
      } else {
        console.warn("No data returned for weekly targets with actuals");
        setWeeklyTargetsWithActuals([]);
        setSelectedTargetData(null);
      }
    } catch (err) {
      console.error("Error fetching weekly targets with actuals:", err);
      setError("Failed to fetch actual data");
      setWeeklyTargetsWithActuals([]);
      setSelectedTargetData(null);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProductId = Number(e.target.value);
    setSelectedProduct(newProductId);
    setSelectedTargetData(null);
  };

  const handleProductionRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as ProductionRole;
    console.log("Production role changed to:", newRole);
    setSelectedProductionRole(newRole);
    setSelectedTargetData(null);
    setWeeklyTargetsWithActuals([]);  // Clear previous data
  };
  

  const handleCardClick = (targetId: number | undefined) => {
    if (targetId) {
      const selectedData = weeklyTargetsWithActuals.find(wta => wta.layerId === targetId);
      setSelectedTargetData(selectedData || null);
    } else {
      setSelectedTargetData(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <select
          className="select text-xs mr-4 select-bordered select-sm"
          value={selectedProduct || ""}
          onChange={handleProductChange}
        >
          <option value="" disabled>
            Select a product
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <select
          className="select text-xs mr-4 select-bordered select-sm"
          value={selectedProductionRole || ""}
          onChange={handleProductionRoleChange}
        >
          <option value="" disabled>
            Select a role
          </option>
          {Object.values(ProductionRole).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <div className="flex items-center">
          <button
            onClick={handlePreviousWeek}
            className="btn btn-outline btn-sm text-[#196A58] hover:bg-[#196A58] hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <div className="text-lg font-semibold text-[#196A58] mx-4">
            {formatDateRange(weekRange.start, weekRange.end)}
          </div>
          <button
            onClick={handleNextWeek}
            className="btn btn-outline btn-sm text-[#196A58] hover:bg-[#196A58] hover:text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center my-8">
          <span className="loading loading-spinner loading-lg text-[#196A58]"></span>
        </div>
      )}

      {error && (
        <div className="alert bg-red-100 text-red-700 shadow-lg mb-6">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!isLoading && weeklyTargets.length === 0 && !error && (
        <div className="text-center text-[#196A58] my-8">
          No weekly targets available for this week, product, and role.
        </div>
      )}
 {weeklyTargets.length > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weeklyTargets.map((target) => {
              const layer = layers.find(l => l.id === target.layerId);
              const actualData = Array.isArray(weeklyTargetsWithActuals) 
                ? weeklyTargetsWithActuals.find((wta) => wta.layerId === target.layerId)
                : null;
              const actualAmount = actualData?.weeklyActuals[0]?.actualAmount || 0;
              const actualPercentage =
                target.amount && target.amount > 0 ? (actualAmount / target.amount) * 100 : 0;

              return (
                <div
                  key={target.id}
                  className={`card mb-4 shadow-xl cursor-pointer ${
                    selectedTargetData?.layerId === target.layerId ? "bg-[#196A58]/10" : ""
                  }`}
                  onClick={() => handleCardClick(target.layerId)}
                >
                  <div className="card-body p-4">
                    <h3 className="card-title text-[#196A58] text-sm flex items-center">
                      <Layers className="w-4 h-4 mr-2" />
                      {layer?.name || "N/A"}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1 text-[#196A58]" />
                        <span className="text-xs font-medium">
                          Target: {target.amount}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <ArrowUpCircle className="w-4 h-4 mr-1 text-[#196A58]" />
                        <span className="text-xs font-medium">
                          Achieved: {actualAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          Sheets
                        </span>
                        <span className="text-xs font-semibold text-[#196A58]">
                          {actualPercentage.toFixed(2)}% Achieved
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#196A58] h-2 rounded-full"
                          style={{
                            width: `${Math.min(actualPercentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

{Array.isArray(weeklyTargetsWithActuals) && weeklyTargetsWithActuals.length > 0 && selectedTargetData && (
        <div className="flex flex-col lg:flex-row justify-center items-start gap-4 overflow-x-auto">
                    <DailyPerformanceChart selectedTarget={selectedTargetData} />

          <WeeklyPerformanceChart selectedTarget={selectedTargetData} />
        </div>
      )}
    </div>
  );
};

export default WeeklyStatsComponent;