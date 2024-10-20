import * as React from "react";
import { Layer, ProductionRole, Product } from "../../types";
import { dashboardService, ProductivityData } from "../../services/dashboardService";
import { entityService } from "../../services/entityService";
import { DateTime } from "luxon";
import ChartContent from "./ChartContent";

interface TargetsChartProps {
  date: string;
  onLayerSelect: (layer: Layer | null | undefined) => void;
  onProductSelect: (productId: number ) => void;
  onProductionRoleSelect: (productionRole: ProductionRole) => void;
}

export default function TargetsChart({
  date,
  onLayerSelect,
  onProductionRoleSelect,
  onProductSelect,
}: TargetsChartProps) {
  const [productivityData, setProductivityData] = React.useState<ProductivityData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);
  const [selectedProductionRole, setSelectedProductionRole] = React.useState<ProductionRole>(ProductionRole.Production);
  const [selectedLayer, setSelectedLayer] = React.useState<Layer | null | undefined>(null);
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  React.useEffect(() => {
    if (date && selectedProductId) {
      fetchProductivityData(date, selectedProductId, selectedProductionRole);
    }
    setSelectedLayer(null); 
  }, [date, selectedProductId, selectedProductionRole]);

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await entityService.getAllProducts();
      setProducts(fetchedProducts);
      if (fetchedProducts.length > 0) {
        setSelectedProductId(fetchedProducts[0].id);
        onProductSelect(fetchedProducts[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchProductivityData = async (selectedDate: string, productId: number, productionRole: ProductionRole) => {
    try {
      const localDate = DateTime.fromISO(selectedDate).toFormat("yyyy-MM-dd");
      console.log("Fetching productivity data for date:", localDate, "productId:", productId, "productionRole:", productionRole);
      const fetchedData = await dashboardService.GetProductivityDashboard(
        localDate,
        productId,
        productionRole
      );
      console.log("Fetched productivity data:", fetchedData);
      setProductivityData(fetchedData);
    } catch (error) {
      console.error("Error fetching productivity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProductId = parseInt(e.target.value);
    setSelectedProductId(newProductId);
    onProductSelect(newProductId);
  };

  const handleProductionRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProductionRole = e.target.value as ProductionRole;
    setSelectedProductionRole(newProductionRole);
    onProductionRoleSelect(newProductionRole); // Call this function to update the parent
  };


  const handleLayerClick = (layer: Layer | null | undefined) => {
    setSelectedLayer(layer);
    onLayerSelect(layer);
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await dashboardService.downloadExcel(date);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Forms_${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <div className="flex ml-2  flex-row">
          <div>
            <select
              id="product-select"
              value={selectedProductId || ''}
              onChange={handleProductChange}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm mr-4"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              id="production-select"
              value={selectedProductionRole}
              onChange={handleProductionRoleChange}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm mr-4"
            >
              {/* {Object.values(ProductionRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))} */}        <option value={ProductionRole.Production as ProductionRole}>Production</option>
                        <option value={ProductionRole.DailyQC as ProductionRole}>Daily QC</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleDownloadExcel}
          className="text-[#196A58] rounded-md hover:bg-[#196A58] p-1 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#196A58] focus:ring-opacity-50"
          aria-label="Download Excel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : !productivityData || productivityData.layerData.length === 0 ? (
        <div className="w-full h-[400px] flex items-center justify-center border border-[#196A58] rounded-md">
          <p className="text-2xl font-bold text-[#196A58]">
            No productivity data available for selected product and date
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto  px-2 py-2">
          <div className="flex space-x-4" style={{ minWidth: "max-content" }}>
          {productivityData.layerData
              .filter(layerData => layerData.targetAmount !== 0 || layerData.achievedAmount !== 0)
              .map((layerData) => (
                <ChartContent
                  productionRole={selectedProductionRole}
                  key={layerData.layerId}
                  layerData={layerData}
                  onLayerClick={() => handleLayerClick({ id: layerData.layerId, name: layerData.layerName })}
                  isSelected={selectedLayer?.id === layerData.layerId}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}