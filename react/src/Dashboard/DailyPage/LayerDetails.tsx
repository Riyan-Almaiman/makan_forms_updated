/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Layer, ProductionRole } from "../../types";
import { FormByDateAndLayer, FormState, dashboardService } from "../../services/dashboardService";
import { attendanceService } from "../../services/attendanceService";
import CalculationsInfo from "./CalculationsInfo";
import { sheetAssignmentService } from "../../services/SheetAssignmentService";

interface LayerDetailsProps {
    layer: Layer | null | undefined;
    date: string;
    productionRole: ProductionRole;
    product: number | null | undefined;
}

interface FormWithAttendance extends FormByDateAndLayer {
    actualHours: number | "N/A";
    achievedSheets: number;
    targetSheets: "N/A";
}

function formatName(fullName: string | undefined | null): string {
    if (!fullName) return '';
    const names = fullName.trim().split(/\s+/);
    if (names.length <= 2) {
      return fullName;
    } else {
      return `${names[0]} ${names[names.length - 1]}`;
    }
}

const LayerDetails: React.FC<LayerDetailsProps> = ({ layer, product, date, productionRole }) => {
    const [formsWithAttendance, setFormsWithAttendance] = useState<FormWithAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedComment, setSelectedComment] = useState<string | null>(null);
    const [sheetAssignments, setSheetAssignments] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!layer?.id) {
                setFormsWithAttendance([]);
                return;
            }
                
            setIsLoading(true);
            try {
                console.log("Fetching forms for layer:", layer.id, "date:", date, "product:", product, "productionRole:", productionRole);
                const forms = await dashboardService.GetFormsByDateAndLayer(date, layer.id, product || 0, productionRole);

                const nationalIds = forms.map(form => form.nationalID).filter(Boolean) as string[];
                const taqniaIDs = forms.map(form => form.taqniaID).filter(Boolean) as number[];

                const attendanceData = await attendanceService.getBulkAttendance(nationalIds, date);
                const sheetAssignments = productionRole === ProductionRole.Production
                    ? await sheetAssignmentService.fetchDailyAssignments(taqniaIDs, date, layer.id)
                    : [];
                setSheetAssignments(sheetAssignments);

                const updatedForms: FormWithAttendance[] = forms.map(form => {
                    const attendance = attendanceData[form.nationalID || ''];
                    const actualHours = attendance ? calculateHours(attendance.first_punch?.timestamp, attendance.last_punch?.timestamp) : "N/A";
                    const achievedSheets = form.dailyTargets.reduce((sum, target) => sum + (target.productivity || 0), 0);

                    return {
                        ...form,
                        actualHours,
                        achievedSheets,
                        targetSheets: "N/A",
                    };
                });

                setFormsWithAttendance(updatedForms);
            } catch (error) {
                console.error("Error fetching layer data:", error);
                setFormsWithAttendance([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [layer, date, product, productionRole]);

    const calculateHours = (firstPunch?: string, lastPunch?: string): number => {
        if (!firstPunch || !lastPunch) return 0;
        const start = new Date(firstPunch);
        const end = new Date(lastPunch);
        return Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    };

    const formatHoursAndMinutes = (decimalHours: number): string => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    const formatCondensedRemarks = (dailyTargets: any[]): string => {
        const remarkCounts = dailyTargets.reduce((counts, target) => {
            counts[target.remarkName] = (counts[target.remarkName] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
        return Object.keys(remarkCounts).join(", ");
    };

    if (!layer) {
        return <div className="bg-white p-4 rounded-lg shadow">Select a layer to view details</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
                <h3 className="font-bold text-lg">Layer: {layer.name} ({productionRole})</h3>
                <div className="flex ml-4 items-center">
                    <CalculationsInfo layerName={layer.name} />
                </div>
            </div>
            <p className="mb-4">Date: {date}</p>

            {isLoading ? (
                <div className="flex justify-center items-center">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : formsWithAttendance.length === 0 ? (
                <div className="alert text-white bg-[#196A58]">
                    No data available for this layer and date.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Employee Type</th>
                                <th>Attendance (Hours)</th>
                                <th>Achieved Sheets</th>
                                {productionRole === ProductionRole.Production && <th>Target Sheets</th>}
                                {productionRole === ProductionRole.Production && <th>Remarks</th>}
                                <th>Status</th>
                                <th>Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formsWithAttendance.map((form) => (
                                <tr key={form.formId}>
                                    <td>{formatName(form.employeeName)}</td>
                                    <td>{form.employeeType}</td>
                                    <td>
                                        {typeof form.actualHours === 'number'
                                            ? formatHoursAndMinutes(form.actualHours)
                                            : form.actualHours}
                                    </td>
                                    <td>{form.achievedSheets.toFixed(2)}</td>
                                    {productionRole === ProductionRole.Production && <td>{sheetAssignments[form.taqniaID]}</td>}
                                    {productionRole === ProductionRole.Production && <td>{formatCondensedRemarks(form.dailyTargets)}</td>}
                                    <td>
                                        <span className={`badge font-bold text-white badge-sm ${getStatusBadgeClass(form.approvalStatus)}`}>
                                            {getApprovalStatusString(form.approvalStatus)}
                                        </span>
                                    </td>
                                    <td>
                                        {form.comment ? (
                                            <button
                                                className="btn btn-xs btn-ghost"
                                                onClick={() => setSelectedComment(form.comment)}
                                            >
                                                {form.comment.substring(0, 20)}...
                                            </button>
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedComment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="font-bold text-lg">Comment</h3>
                        </div>
                        <div className="p-4 overflow-y-auto flex-grow">
                            <p className="whitespace-pre-wrap break-words">{selectedComment}</p>
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setSelectedComment(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getApprovalStatusString = (status: number): string => {
    const statusMap: { [key: number]: string } = {
        [FormState.New]: "New",
        [FormState.Pending]: "Pending",
        [FormState.Approved]: "Approved",
        [FormState.Rejected]: "Rejected"
    };
    return statusMap[status] || "Unknown";
};

const getStatusBadgeClass = (status: number): string => {
    const classMap: { [key: number]: string } = {
        [FormState.Approved]: "badge-success",
        [FormState.Pending]: "badge-warning",
        [FormState.Rejected]: "badge-error"
    };
    return classMap[status] || "badge-info";
};

export default LayerDetails;