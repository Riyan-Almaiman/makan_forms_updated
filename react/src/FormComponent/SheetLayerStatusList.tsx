import React, { useState, useEffect } from 'react';
import { SheetLayerStatus, Form, DailyTarget, ProductionRole } from '../types';
import { SearchSheetStatus } from './SearchSheetStatus';
import { CheckCircle } from 'lucide-react';

interface Props {
    form: Form;
    setForm: React.Dispatch<React.SetStateAction<Form>>;
    userLayerId: number;
}

const SheetLayerStatusList: React.FC<Props> = ({ form, setForm, userLayerId }) => {
    const [sheetStatuses, setSheetStatuses] = useState<SheetLayerStatus[]>([]);
    // const [loading, setLoading] = useState(false);
    // const [error, setError] = useState<string | null>(null);

    const isQCRole = [ProductionRole.DailyQC, ProductionRole.FinalQC, ProductionRole.FinalizedQC].includes(form.productionRole as ProductionRole);

    useEffect(() => {
        setSheetStatuses([]);
        // const fetchCompletedSheetStatuses = async () => {
        //   setLoading(true);
        //   setError(null);
        //   try {
        //     const response = await axios.get<SheetLayerStatus[]>(`${URL}/api/sheetlayerstatus/completed`, {
        //       params: {
        //         layerId: userLayerId,
        //         productId: form.product?.id,
        //         role: form.productionRole
        //       },
        //       headers: getAuthHeader()
        //     });
        //     setSheetStatuses(response.data);
        //   } catch (err) {
        //     console.error('Error fetching completed sheet statuses:', err);
        //     setError('Failed to fetch completed sheet statuses. Please try again.');
        //   } finally {
        //     setLoading(false);
        //   }
        // };

        // if (isQCRole) {
        //   fetchCompletedSheetStatuses();
        // }
    }, [form.productionRole, isQCRole, userLayerId, form.productivityDate, form.product?.id]);

    const toggleDailyTarget = (sheetStatus: SheetLayerStatus) => {
        if (isQCRole && sheetStatus.completion !== 1) return;

        if (isAlreadyAdded(sheetStatus.id)) {
            setForm(prevForm => ({
                ...prevForm,
                dailyTargets: prevForm.dailyTargets.filter(target => target.sheetLayerStatusId !== sheetStatus.id),
            }));
        } else {
            const newTarget: DailyTarget = {
                targetId: Math.max(0, ...form.dailyTargets.map(t => t.targetId)) + 1,
                hoursWorked: 0,
                productivity: isQCRole ? 1 : 0,
                layer: sheetStatus.layer,
                sheetLayerStatusId: sheetStatus.id,
                sheetLayerStatus: sheetStatus,
                sheetNumber: sheetStatus.sheet?.sheetName,
                formId: form.formId,
                isQC: isQCRole,
            };
            setForm(prevForm => ({
                ...prevForm,
                dailyTargets: [...prevForm.dailyTargets, newTarget],
            }));
        }
    };

    const isAlreadyAdded = (sheetStatusId: number) =>
        form.dailyTargets.some(target => target.sheetLayerStatusId === sheetStatusId);

    const handleSearchResults = (results: SheetLayerStatus[]) => {
        setSheetStatuses(results);
    };

    return (
        <div className="md:col-span-1 flex flex-col h-[calc(100vh-220px)] bg-gray-100 rounded-lg overflow-hidden w-full max-w-md">
            <div className="p-2 bg-gray-100">
                <SearchSheetStatus
                    productId={form.product?.id}
                    layerId={userLayerId}
                    onSearchResults={handleSearchResults}
                    role={form.productionRole as ProductionRole}
                />
            </div>
            <div className="flex-grow overflow-y-auto p-2" style={{ maxHeight: 'calc(100% - 60px)' }}>
                {sheetStatuses.length > 0 ? (
                    sheetStatuses.map((status) => {
                        const isSelected = isAlreadyAdded(status.id);
                        const isCompleted = status.completion === 1;
                        const isClickable = isQCRole ? isCompleted : !isCompleted;
                        return (
                            <button
                                key={status.id}
                                onClick={() => isClickable && toggleDailyTarget(status)}
                                disabled={!isClickable}
                                className={`w-full text-left bg-white rounded-lg shadow-sm p-2 mb-2 transition-colors duration-200 
                  ${!isClickable ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}
                  ${isSelected && isClickable ? 'ring-2 ring-[#196A58] bg-green-50' : ''}
                `}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold truncate mr-2 ${!isClickable ? 'text-gray-500' : 'text-[#196A58]'}`}>
                                        {status.sheet?.sheetName}
                                    </span>
                                    <span className="text-sm text-gray-600 whitespace-nowrap">{status.layer?.name}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1 text-sm">
                                    <span>Completion: <strong>{(status.completion * 100).toFixed(2)}%</strong></span>
                                    {isCompleted && <CheckCircle size={16} className="text-green-500" />}
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 mt-4">
                        No results found. Try a different search term.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SheetLayerStatusList;