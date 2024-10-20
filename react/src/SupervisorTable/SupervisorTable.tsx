import React, { useEffect, useState } from "react";
import { Calculation, Form, User, FormState, ProductionRole } from "../types";
import { DateTime } from "luxon";
import { formService } from "../services/formService";
import { approvalService } from "../services/approvalService";
import CompactFilters from "./Filters";

interface Props {
    user: User;
    calculations: Calculation[];
}
const getStatusBadge = (status: FormState | null | undefined) => {
    switch (status) {
        case FormState.Pending:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
        case FormState.Approved:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
        case FormState.Rejected:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
        default:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
};
const SupervisorTable: React.FC<Props> = ({ user }) => {
    const [forms, setForms] = useState<Form[]>([]);
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<FormState | "All">(FormState.Pending);
    const [loading, setLoading] = useState(true);
    const [supervisorComment, setSupervisorComment] = useState("");

    const fetchData = async (date: string | null) => {
        setLoading(true);
        try {
            let fetchedForms;
            if (date) {
                fetchedForms = await formService.getSupervisorFormsByDate(user.taqniaID, date);
            } else {
                fetchedForms = await formService.getSupervisorPendingForms(user.taqniaID);
            }
            setForms(fetchedForms);
        } catch (error) {
            setForms([])
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate, user.taqniaID]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value || null;
        setSelectedDate(newDate);
        setSelectedForm(null)
        setSelectedStatus("All"); // Reset status when date changes
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStatus(e.target.value as FormState | "All");
    };

    const handleFormSelect = (form: Form) => {
        console.log("selected form: ", form)
        setSelectedForm(form);
        setSupervisorComment("");
    };

    const handleApprove = async () => {
        if (selectedForm) {
            try {
                await approvalService.updateApproval(selectedForm.formId, true, supervisorComment);
                await fetchData(selectedDate);
                setSelectedForm(null);
                setSupervisorComment("");
            } catch (error) {
                console.error("Error approving form:", error);
            }
        }
    };

    const handleReject = async () => {
        if (selectedForm) {
            try {
                await approvalService.updateApproval(selectedForm.formId, false, supervisorComment);
                await fetchData(selectedDate);
                setSelectedForm(null);
                setSupervisorComment("");
            } catch (error) {
                console.error("Error rejecting form:", error);
            }
        }
    };


    const filteredForms = forms.filter((form) => {
        if (selectedStatus !== "All" && form.approvals[0]?.state !== selectedStatus) return false;
        return true;
    });



    return (
        <div className="container mx-auto p-4 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-[#196A58] mb-4">Supervisor Form Review</h2>

            <div className="flex flex-col md:flex-row gap-4">
                {/* Filters and Forms Column */}
                <div className="w-full md:w-1/6 flex flex-col">
                    {/* Filters */}
                    <CompactFilters
                        selectedDate={selectedDate}
                        handleDateChange={handleDateChange}
                        setSelectedDate={setSelectedDate}
                        selectedStatus={selectedStatus}
                        handleStatusChange={handleStatusChange}
                    />

                          <div className="bg-gray-100 p-2 rounded-lg flex-grow overflow-hidden mt-2">
                        <p className="text-xs text-gray-500 mb-2">
                            {selectedDate ? `Forms for ${selectedDate}` : "Showing all Pending forms"}
                        </p>
                        <div className="h-[calc(100vh-350px)] p-1 overflow-y-auto">
                            {loading ? (
                                <p className="text-center text-xs py-2">Loading...</p>
                            ) : filteredForms.length > 0 ? (
                                filteredForms.map((form) => (
                                    <div
                                        key={form.formId}
                                        className={`p-2 mb-1 rounded cursor-pointer bg-white ${selectedForm?.formId === form.formId ? "ring-1 ring-[#196A58]" : ""
                                            }`}
                                        onClick={() => handleFormSelect(form)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs truncate flex-grow">{form.employeeName}</p>
                                            <div className="ml-2 flex-shrink-0 flex items-center space-x-1">
                                                {[ProductionRole.DailyQC].includes(form.productionRole as ProductionRole) && (
                                                    <span className="text-xs font-bold text-blue-600 bg-blue-100 rounded-lg p-1">QC</span>
                                                )}
                                                {getStatusBadge(form.approvals[0]?.state)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs py-2">No forms found</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Details */}
                <div className="w-full md:w-5/6">
                    <div className="bg-gray-100 p-4 rounded-lg h-[calc(100vh-150px)] flex flex-col">
                        <h3 className="text-lg font-semibold mb-2">Form Details</h3>

                        {selectedForm ? (
                            <>
                                <div className="flex-grow overflow-y-auto">
                                    <div className="bg-white p-3 rounded-lg mb-3 flex flex-wrap items-center text-sm">
                                        <div className="flex-1 min-w-[200px]">
                                            <span className="font-semibold">Employee:</span> {selectedForm.employeeName}
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <span className="font-semibold">Product:</span> {selectedForm.product?.name || "No Product"}
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <span className="font-semibold">Date:</span> {DateTime.fromISO(selectedForm.productivityDate).toFormat("MMM. d, yyyy")}
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <span className="font-semibold">Role:</span> 
                                            <span className={`ml-1 ${[ProductionRole.DailyQC].includes(selectedForm.productionRole as ProductionRole) ? 'text-blue-600 font-bold' : ''}`}>
                                                {selectedForm.productionRole || "Production"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto mb-3">
                                        <table className="table w-full">
                                            <thead>
                                                <tr className="bg-gray-200">
                                                    <th>Sheet Number</th>
                                                    <th>Current Sheet Completion</th>
                                                    <th>Productivity</th>
                                                    <th>Layer</th>
                                                    <th>Remark</th>
                                                    <th>Target Type</th>
                                            
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedForm.dailyTargets?.map((dt, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td>{dt.sheetLayerStatus?.sheet?.sheetName || "N/A"}</td>
                                                        <td>
                                                            {dt.sheetLayerStatus === null || dt.sheetLayerStatus === undefined
                                                                ? "N/A"
                                                                : (dt.sheetLayerStatus.completion * 100) + "%"
                                                            }
                                                        </td>
                                                        <td>{dt.productivity * 100 + "%"}</td>

                                                        <td>{dt.layer?.name}</td>
                                                        <td>{dt.remark?.name}</td>
                                                        <td>{dt.isQC ? "QC" : "Production"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>


                                    <div className="bg-white p-3 rounded-lg mb-3 text-sm">
                                        <span className="font-semibold">Editor Comment:</span> {selectedForm.comment || "No Comment"}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="form-control mb-2">
                                        <label className="label">
                                            <span className="label-text font-semibold text-sm">
                                                Supervisor Comment:
                                            </span>
                                        </label>
                                        <textarea
                                            value={supervisorComment}
                                            onChange={(e) => setSupervisorComment(e.target.value)}
                                            placeholder="Add your comment here"
                                            className="textarea textarea-bordered h-16 text-sm"
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-center space-x-4">
                                        <button
                                            onClick={handleApprove}
                                            className="btn btn-sm btn-success px-4 py-1 rounded-full text-white font-semibold transition-all duration-300 hover:bg-green-600"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="btn btn-sm btn-error px-4 py-1 rounded-full text-white font-semibold transition-all duration-300 hover:bg-red-600"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-gray-500">
                                Select a form to view details
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorTable;