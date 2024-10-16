import React, { useEffect, useState } from "react";
import { Calculation, Form, User } from "./types";
import { DateTime } from "luxon";
import { formService } from "./services/formService";
import { useNavigate } from "react-router-dom";

interface Props {
  user: User;
  calculations: Calculation[];
}

const EditorTable: React.FC<Props> = ({ user }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const fetchedForms = await formService.getEditorPendingOrRejectedForms(user.taqniaID);
      setForms(Array.isArray(fetchedForms) ? fetchedForms : []);
      console.log(fetchedForms)
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.taqniaID]);

  const formatDateTime = (dateTimeString: string): string => {
    const dt = DateTime.fromISO(dateTimeString);
    return dt.toFormat("dd/MM/yyyy HH:mm:ss");
  };

  const handleFormClick = (form: Form) => {
    const formattedDate = DateTime.fromISO(form.productivityDate).toFormat("yyyy-MM-dd");
    navigate(`/form/${formattedDate}`);
  };

  const getStatusButton = (form: Form) => {
    const approval = form.approvals && form.approvals[0];
    if (!approval) return null;

    const buttonClasses = "btn ml-4 text-white btn-xs ";
    let buttonText, buttonColor;

    switch(approval.state?.toLowerCase()) {
      case 'pending':
        buttonText = "Pending";
        buttonColor = "bg-orange-400 hover:bg-orange-500 border-orange-500";
        break;
      case 'rejected':
        buttonText = "Rejected";
        buttonColor = "bg-red-700 hover:bg-red-600 border-red-500";
        break;
      default:
        return null;
    }

    return (
      <button
        className={buttonClasses + buttonColor}
        onClick={() => handleFormClick(form)}
      >
        {buttonText}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-4">Pending and Rejected Forms</h2>
      <div className="flex-grow overflow-hidden">
        <div className="overflow-y-auto h-full">
          {loading ? (
            <div className="text-center font-bold text-lg">Loading data...</div>
          ) : (
            <table className="min-w-full table table-zebra bg-gray-200 rounded-lg">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Layers</th>
                  <th>Productivity Date</th>
                  <th>Form Submission Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {forms.length > 0 ? (
                  forms.map((form) => (
                    <tr className="text-balance" key={form.formId}>
                      <td>{form.product?.name || "No Product"}</td>
                      <td>{form.dailyTargets?.map((dt) => dt.layer?.name).join(", ")}</td>
                      <td>{DateTime.fromISO(form.productivityDate).toFormat("dd/MM/yyyy")}</td>
                      <td>{formatDateTime(form.submissionDate)}</td>
                      <td>{getStatusButton(form)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center font-bold text-lg py-4">
                      No pending forms
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorTable;