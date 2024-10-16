/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Form, DailyTarget, Remark } from '../types';
import { XCircle, CheckCircle } from 'lucide-react';
import ProductivitySelect from './ProductivitySelect';

interface Props {
  form: Form;
  remarks: Remark[];
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  userLayer: { id: number; name: string } | undefined;
}

const DailyTargetList: React.FC<Props> = ({ form, setForm, remarks }) => {
  const handleDailyTargetChange = (targetId: number, field: keyof DailyTarget, value: any) => {
    setForm(prevForm => ({
      ...prevForm,
      dailyTargets: prevForm.dailyTargets.map(target => 
        target.targetId === targetId ? { ...target, [field]: value } : target
      ),
    }));
  };

  const removeDailyTarget = (targetId: number) => {
    setForm(prevForm => ({
      ...prevForm,
      dailyTargets: prevForm.dailyTargets.filter(target => target.targetId !== targetId),
    }));
  };

  return (
    <div className="md:col-span-3">
      <div className="bg-gray-100 p-2 rounded-lg h-[calc(100vh-220px)] overflow-y-auto">
        {form.dailyTargets.map(target => (
          <div key={target.targetId} className="bg-white mb-2 rounded-lg shadow-sm p-2 relative flex items-center space-x-2">
            <div className="flex-grow flex items-center space-x-2">
              <span className="font-medium text-[#196A58] text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {target.sheetLayerStatus?.sheet?.sheetName ?? 'Unknown Sheet'}
              </span>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                (Layer: {target.sheetLayerStatus?.layer?.name})
              </span>
            </div>
            {target.isQC ? (
              <div className=" flex items-center justify-end space-x-2">
                <span className="text-sm text-green-600">QC</span>
                <CheckCircle size={20} className="text-green-600" />
              </div>
            ) : (
              <>
                <div className="flex-grow-0 flex-shrink-0 w-1/4">
                  <ProductivitySelect 
                    target={target}
                    handleDailyTargetChange={handleDailyTargetChange}
                  />
                </div>
                <div className="flex-grow-0 flex-shrink-0 w-1/4">
                  <select
                    value={target.remark?.id || ''}
                    onChange={(e) => handleDailyTargetChange(target.targetId, 'remark', { id: Number(e.target.value), name: e.target.options[e.target.selectedIndex].text })}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                  >
                    <option value="">Select Remark</option>
                    {remarks.map(remark => (
                      <option key={remark.id} value={remark.id}>{remark.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button
              onClick={() => removeDailyTarget(target.targetId)}
              className="text-red-600 hover:text-red-500 focus:outline-none"
              aria-label="Remove target"
            >
              <XCircle size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyTargetList;