import * as React from "react";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import { LayerData } from "../../services/dashboardService";
import { ProductionRole } from "../../types";

interface ChartContentProps {
  layerData: LayerData;
  onLayerClick: () => void;
  isSelected: boolean;
  productionRole: ProductionRole
}

export default function ChartContent({
  layerData,
  onLayerClick,
  productionRole,
  isSelected,
}: ChartContentProps) {
  const chartSize = 150; // You can adjust this or make it dynamic based on your needs

  const { targetAmount, achievedAmount, remarks } = layerData;

  let pieData;
  if (achievedAmount >= targetAmount) {
    pieData = [{ id: 0, value: achievedAmount, label: "Achieved", color: "#196A58" }];
  } else {
    const remaining = targetAmount - achievedAmount;
    pieData = [
      { id: 0, value: achievedAmount, label: "Achieved", color: "#196A58" },
      { id: 1, value: remaining, label: "Remaining", color: "#EE4B2B" },
    ];
  }

  return (
    <div
      className={`flex flex-col items-center p-2 border rounded-lg shadow-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 ${
        isSelected ? 'outline outline-1 bg-[#196A58]/10' : ''
      }`}
      onClick={onLayerClick}
      style={{ width: `${chartSize}px`, flexShrink: 0 }}
    >
      <h3 className="text-sm font-bold mb-2">{layerData.layerName} </h3>   <p className="text-xs">
          Operators Count: {layerData.totalEditors}
        </p>
      <PieChart
        series={[
          {
            data: pieData,
            innerRadius: chartSize * 0.2,
            outerRadius: chartSize * 0.4,
            paddingAngle: 0,
            cornerRadius: 0,
            cx: chartSize / 2,
            cy: chartSize / 2,
            arcLabel: (item) =>
              item.value === 0 ? "" : `${item.value.toFixed(2)}`,
            arcLabelMinAngle: 45,
          },
        ]}
        height={chartSize}
        width={chartSize}
        slotProps={{
          legend: { hidden: true },
        }}
        sx={{
          [`& .${pieArcLabelClasses.root}`]: {
            fill: "white",
            fontSize: "12px",
          },
        }}
      />
      <div className="text-center mt-2">
        <p className="text-xs">
          Target: {targetAmount.toFixed(2)}
        </p>
        <p className="text-xs">
          Achieved: {achievedAmount.toFixed(2)}
        </p>
        <p className="text-xs">
          Approved Forms: {layerData.totalForms}
        </p>
     
        <p className="text-xs font-semibold">
          Completion: {targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0}%
        </p>
      </div>

      {productionRole == ProductionRole.Production && Object.keys(remarks).length > 0 && (
        <div className="w-full mt-2 border-t pt-2">
          <p className="text-xs font-semibold mb-1">Remarks:</p>
          <div className="grid grid-cols-2 gap-x-2 text-xs">
            {Object.entries(remarks).map(([remark, productivity]) => (
              <React.Fragment key={remark}>
                <div className="text-left">{remark}:</div>
                <div className="text-right">{productivity.toFixed(2)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}