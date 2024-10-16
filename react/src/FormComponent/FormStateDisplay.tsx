import React from 'react';
import { FormState } from '../types';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface FormStateDisplayProps {
  formState: FormState | undefined;
  supervisorComment: string | undefined | null;
}

const FormStateDisplay: React.FC<FormStateDisplayProps> = ({ formState, supervisorComment }) => {
  if (formState === "New") return null;

  const getStatusIcon = () => {
    switch (formState) {
      case "pending":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "rejected":
        return <XCircle size={16} className="text-red-500" />;
      case "approved":
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (formState) {
      case "pending":
        return "text-yellow-700 bg-yellow-50";
      case "rejected":
        return "text-red-700 bg-red-50";
      case "approved":
        return "text-green-700 bg-green-50";
      default:
        return "";
    }
  };

  return (
    <div className={`text-sm p-2 rounded-md mb-2 flex items-center ${getStatusColor()}`}>
      <span className="mr-2">{getStatusIcon()}</span>
      <span className="font-medium mr-2">
        {formState === "pending" && "Pending Review"}
        {formState === "rejected" && "Rejected"}
        {formState === "approved" && "Approved"}
      </span>
      {supervisorComment && (
        <span className="text-xs">
          Supervisor comment: {supervisorComment}
        </span>
      )}
    </div>
  );
};

export default FormStateDisplay;