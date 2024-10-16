import React from "react";
import { FormState } from "../types";

interface CompactFiltersProps {
  selectedDate: string | null;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedDate: React.Dispatch<React.SetStateAction<string | null>>;
  selectedStatus: FormState | "All";
  handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  
}

const CompactFilters: React.FC<CompactFiltersProps> = ({ 
  selectedDate, 
  handleDateChange, 
  setSelectedDate, 
 
  selectedStatus, 
  handleStatusChange, 
   

}) => {
  return (
    <div className="bg-gray-100 p-3 rounded-lg mb-3">
      <h3 className="text-md font-semibold mb-2">Filters</h3>
      <div className="flex flex-wrap gap-2">
        <div className="w-full sm:w-auto flex-grow">
          <div className="flex items-center">
            <input
              type="date"
              value={selectedDate || ''}
              onChange={handleDateChange}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#196A58]"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="ml-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        
        </div>
  
        <div className="w-full sm:w-auto flex-grow">
          <select
            disabled = {selectedDate == null}
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#196A58]"
          >
            <option value="All">All</option>
            <option value={FormState.Pending}>Pending</option>
            <option value={FormState.Approved}>Approved</option>
            <option value={FormState.Rejected}>Rejected</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CompactFilters;