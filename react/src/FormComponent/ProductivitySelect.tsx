/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { DailyTarget } from '../types';

interface Props {
    target: DailyTarget;
    handleDailyTargetChange: (targetId: number, field: keyof DailyTarget, value: any) => void;
}

const ProductivitySelect: React.FC<Props> = ({ target, handleDailyTargetChange }) => {
    const currentCompletion = target.sheetLayerStatus?.completion || 0;
    const currentCompletionPercentage = Math.round(currentCompletion * 100);

    const productivityOptions = [
        { value: currentCompletionPercentage, label: `Current: ${currentCompletionPercentage}%` },
        ...Array.from({ length: 10 - Math.floor(currentCompletionPercentage / 10) }, (_, i) => {
            const value = Math.min(((Math.floor(currentCompletionPercentage / 10) + i + 1) * 10), 100);
            return {
                value: value,
                label: `${value}%`
            };
        })
    ];

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = Number(e.target.value) / 100;
        const newProductivity = selectedValue - currentCompletion;
        handleDailyTargetChange(target.targetId, 'productivity', newProductivity);
        handleDailyTargetChange(target.targetId, 'completion', selectedValue);

    };

    // Calculate the current total (completion + productivity)
    const currentTotal = currentCompletion + target.productivity;
    const currentTotalPercentage = Math.round(currentTotal * 100);

    return (
        <div>
            <select
                value={currentTotalPercentage}
                onChange={handleSelectChange}
                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
            >
                {productivityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProductivitySelect;