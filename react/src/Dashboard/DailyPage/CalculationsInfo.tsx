import React from 'react';
import { Info } from 'lucide-react';

interface CalculationsInfoProps {
    layerName: string;
}

const calculations: Record<string, Record<string, number>> = {
    "Agriculture": {
        "Dense": 0.6,
        "Difficult": 0.2,
        "Medium": 1.2,
        "Easy": 12,
        "Empty": 41
    },
    "Roads": {
        "Dense": 0.5,
        "Medium": 1,
        "Easy": 4,
        "Empty": 6
    },
    "Buildings": {
        "Dense": 0.5,
        "Medium": 2,
        "Easy": 7,
        "Empty": 14
    },
    "Utility Network": {
        "Dense": 1,
        "Medium": 6.5,
        "Easy": 16,
        "Empty": 26
    },
    "Hydrography": {
        "Dense": 1,
        "Medium": 1.5,
        "Easy": 2,
        "Empty": 3
    },
    "Physiography": {
        "Dense": 1,
        "Medium": 1.5,
        "Easy": 4,
        "Empty": 6
    },
    "Airports & Coast lines": {
        "Dense": 1,
        "Medium": 1.5,
        "Easy": 4,
        "Empty": 6
    }
};

const CalculationsInfo: React.FC<CalculationsInfoProps> = ({ layerName }) => {
    const layerCalculations = calculations[layerName];

    return (
        <div className="relative inline-block group">
            <Info size={20} className="text-blue-500 cursor-pointer" />
            <div className="absolute z-10 w-64 p-4 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 -left-28 top-full mt-2">
                <h3 className="font-bold mb-2">{layerName} Daily Targets</h3>
                {layerCalculations ? (
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="text-left">Type</th>
                                <th className="text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(layerCalculations).map(([type, value]) => (
                                <tr key={type}>
                                    <td className="text-left">{type}</td>
                                    <td className="text-right">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-gray-600">No calculations available for this layer.</p>
                )}
            </div>
        </div>
    );
};

export default CalculationsInfo;