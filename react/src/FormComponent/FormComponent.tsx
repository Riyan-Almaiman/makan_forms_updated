import React, {  useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User} from "../types";
import { useFormManagement } from "./useFormManagement";
import { validateForm } from "./formUtils";
import { formService } from "../services/formService";
import DailyTargetList from "./DailyTargetList";
import FormStateDisplay from "./FormStateDisplay";
import EmployeeDetails from "./EmployeeDetails";
import SupervisorDetails from "./SupervisorDetails";
import SheetLayerStatusList from "./SheetLayerStatusList";

interface Props {
  user: User;
}

const FormComponent: React.FC<Props> = ({ user }) => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    form,
    setForm,
    setFormExists,
    supervisors,
    remarks,
    formState,
    isFormEditable,
  } = useFormManagement(user, date || "");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    navigate(`/form/${newDate}`);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm(form) && !isSubmitting && isFormEditable) {
      setIsSubmitting(true);
      const formToSubmit = {
        ...form,
        submissionDate: new Date().toISOString(), 
      };
      console.log("Submitting Form: ", formToSubmit);
      try {
        const updatedForm = await formService.createOrUpdateForm(formToSubmit);
        setForm(updatedForm);
        console.log("response" , updatedForm);
        setFormExists(true);
        navigate(`/form/${form.productivityDate}`);

        alert("Form submitted successfully!");
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error submitting form. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  const isFormReady = form?.supervisorTaqniaID && date && user.layerAssignment && user.productAssignment && user.productionRole;
  const isDisabled = !isFormEditable || !isFormReady || isSubmitting;
  
  return (
    <div className="h-full mx-auto p-4 bg-white rounded-lg shadow-lg">
     
      <FormStateDisplay
        formState={formState}
        supervisorComment={form?.approvals[0]?.supervisorComment}
      />
      <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <EmployeeDetails name={user?.name || "Invalid User"} />
        <SupervisorDetails
          supervisors={supervisors}
          supervisorTaqniaID={form?.supervisorTaqniaID}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Layer Assignment
          </label>
          <input
            type="text"
            value={user.layerAssignment?.name || "Not Assigned"}
            disabled
            className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Production Role
          </label>
          <input
            type="text"
            value={form.productionRole || "Not Specified"}
            disabled
            className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
            Select Product
          </label>
          <input
            type="text"
            value={form.product?.name || "Not Specified"}
            disabled
            className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            value={date ? formatDate(date) : ""}
            onChange={handleDateChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
            lang="en-US"
          />
        </div>
      </div>

      {isFormReady &&
 (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SheetLayerStatusList
                form={form}
                setForm={setForm}
                userLayerId={user.layerAssignment?.id || 1}
              />
              <div className="md:col-span-2">
                <DailyTargetList
                  userLayer={user.layerAssignment}
                  remarks={remarks}
                  form={form}
                  setForm={setForm}
                />
              </div>
            </div>
          </div>
          
          <div className="md:w-1/4 flex flex-col">
            <div className="flex-grow">
            
              <textarea
                id="comment"
                rows={4}
                value={form.comment || ""}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="block w-full h-full rounded-md border-gray-300 shadow-sm focus:border-[#196A58] focus:ring focus:ring-[#196A58] focus:ring-opacity-50"
                placeholder="Add any additional comments here..."
              />
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleSubmit}
                className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-200
                  ${isDisabled 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#196A58] text-white hover:bg-[#124c3f] focus:ring-[#196A58]'
                  }`}
                disabled={isDisabled}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormComponent;