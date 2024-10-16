import React from 'react';
import { Form, SheetAssignment, DailyTarget, FormState } from '../types';
import { initialTarget } from './formUtils';
import { PlusCircle } from 'lucide-react';

interface Props {
  assignedSheets: SheetAssignment[];
  form: Form;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
}

const getStatusBadge = (status: FormState | null | undefined) => {
  switch (status) {
    case FormState.Pending:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">In Progress</span>;
    case FormState.Approved:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">Completed</span>;
    default:
      return null;
  }
};

const SheetAssignmentList: React.FC<Props> = ({ assignedSheets, form, setForm }) => {
  const addDailyTarget = (sheetAssignmentId: number) => {
    const existingTarget = form.dailyTargets.find(t => t.sheetAssignmentId === sheetAssignmentId);
    
    if (!existingTarget) {
      const newTarget: DailyTarget = {
        ...initialTarget(),
        sheetAssignmentId,
        sheetAssignment: assignedSheets.find(a => a.sheetAssignmentId === sheetAssignmentId),
        targetId: Math.max(0, ...form.dailyTargets.map(t => t.targetId)) + 1,
      };
      
      setForm(prevForm => ({
        ...prevForm,
        dailyTargets: [...prevForm.dailyTargets, newTarget],
      }));
    }
  };
  const sortedAssignments = [...assignedSheets].sort((a, b) => {
    return a.inProgress === b.inProgress ? 0 : a.inProgress ? -1 : 1;
  });
  return (
    <div className="md:col-span-1">
      <h3 className="text-lg font-semibold mb-2">Sheet Assignments</h3>
      <div className="bg-gray-100 p-2 rounded-lg h-[calc(100vh-300px)] overflow-y-auto">
        {sortedAssignments.map(assignment => {
          const hasTarget = form.dailyTargets.some(t => t.sheetAssignmentId === assignment.sheetAssignmentId);
          
          return (
            <div
              key={assignment.sheetAssignmentId}
              className="flex justify-between items-center p-2 mb-2 rounded-lg bg-white"
            >
              <div>
                <p className="font-medium">Sheet: {assignment.sheet?.sheetName}</p>
                <div className="mt-1">
                  {getStatusBadge(assignment.inProgress ? FormState.Pending : FormState.Approved)}
                </div>
              </div>
              {!hasTarget ? (
                <button
                  onClick={() => addDailyTarget(assignment.sheetAssignmentId)}
                  className=" bg-[#196A58] text-white rounded-full hover:bg-[#124c3f] focus:outline-none focus:ring-2 focus:ring-[#196A58] focus:ring-opacity-50 transition-colors duration-200"
                  aria-label="Add Target"
                >
                  <PlusCircle size={30} />
                </button>
              ) : (
                <span className="text-sm text-gray-500">Target Added</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SheetAssignmentList;