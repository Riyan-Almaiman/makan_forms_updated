/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { URL } from '../../config';
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function
import { ProductionRole } from '../types';

const API_URL = `${URL}/api/dashboard`;

export interface DailyActual {
    date: string;
    actualAmount: number;
    target: number
}

export interface WeeklyActual {
    weekStart: string;
    actualAmount: number;
}

export interface WeeklyTargetWithActual {
    weekStart: string;
    layerId: number;
    layerName: string;
    weeklyTargetAmount: number;
    weeklyActuals: WeeklyActual[];
    dailyActuals: DailyActual[];
}

export interface DailyTarget {
    layerName: string | null;
    hoursWorked: number;
    productivity: number;
    expectedProductivity: number | null;
    remarkName: string | null;
    sheetNumber: string | null;
}

export interface PerformanceData {
    date: string;
    formId: number | null;
    editorName: string;
    productName: string | null;
    totalHoursWorked: number;
    totalProductivity: number;
    dailyTargets: DailyTarget[];
}

export interface EditorPerformanceResponse {
    editorName: string;
    performanceData: PerformanceData[];
}

export interface ProductivityData {
    date: string;
    productId: number;
    productionRole: string;
    layerData: LayerData[];
}

export interface LayerData {
    layerId: number;
    layerName: string;
    targetAmount: number;
    remarks: { [key: string]: number };
    achievedAmount: number;
    totalForms: number;
    totalEditors: number;
}
export type FormComment = {
    formId: number;
    employeeName: string;
    layers: string;
    comment: string | null;
    productivityDate: string;
};
export interface ProjectTargetsResponse {
    deliveryNumber: number;
    totalSheets: number;
    totalInProgressSheets: number;
    totalCompletedSheets: number;
    totalCompletedQC: number;
    totalCompletedFinalQC: number;
    totalCompletedFinalizedQC: number;
    layerData: Array<{
        layerId: number;
        layerName: string;
        totalSheets: number;
        inProgressSheetCount: number;
        completedSheetCount: number;
        completedQCCount: number;
        completedFinalQCCount: number;
        completedFinalizedQCCount: number;
    }>;
}


export type FormByDateAndLayer = {
    formId: number;
    employeeName: string;
    nationalID: string | null;
    productName: string;
    comment: string | null;
    productivityDate: string;
    taqniaID: number;
    employeeType: string;
    dailyTargets: Array<{
        hoursWorked: number;
        productivity: number;
        expectedProductivity: number | null;
        remarkName: string | null;
        sheetNumber: string | null;
    }>;
    approvalStatus: number;
};
export interface EditorStatus {
    hasForm: boolean;
    status: string;
}

export interface SupervisorData {
    [editorName: string]: EditorStatus;
}

export interface LayerData {
    layerName: string;
    supervisors: {
        [supervisorName: string]: SupervisorData;
    };
}

export interface SupervisorTeamOverview {
    [layerId: number]: LayerData;
}

export enum FormState {
    New = 0,
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Unknown = 4
}

export const dashboardService = {
    getCompletedSheetsCount: async (productId: number, delivery: number): Promise<number> => {
        try {
            const response = await axios.get<{ completedSheetsCount: number }>(
                `${API_URL}/completed-sheets-count/${productId}/${delivery}`,
                {
                    headers: getAuthHeader()
                }
            );
            console.log('Completed sheets count:', response.data.completedSheetsCount);
            return response.data.completedSheetsCount;
        } catch (error) {
            console.error('Error fetching completed sheets count:', error);
            throw error;
        }
    },

    downloadCompletedSheetsExcel: async (): Promise<Blob> => {
        try {
            const response = await axios.get(`${API_URL}/completed-sheets-excel`, {
                responseType: 'blob',
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading completed sheets Excel:', error);
            throw error;
        }
    },
    downloadCompletedSheetStatusesExcel: async (): Promise<Blob> => {
        const response = await axios.get(`${API_URL}/completed-sheet-statuses-excel`, {
            responseType: 'blob',
            headers: getAuthHeader()
        });
        return response.data;
    },
    getSupervisorTeamOverview: async (
        date: string,
        productionRole: ProductionRole,
        productId: number
    ): Promise<SupervisorTeamOverview> => {
        try {
            const response = await axios.get<SupervisorTeamOverview>(
                `${API_URL}/supervisor-team-overview`, {
                params: {
                    date,
                    productionRole,
                    productId
                },
                headers: getAuthHeader()
            }
            );
            console.log('Supervisor team overview:', response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return {};
            }
            throw error;
        }
    },

    downloadExcel: async (date: string, productionRole: ProductionRole, productId: number | null): Promise<Blob | null > => {
        if(!productId){
            return null; 
        }
        const response = await axios.get(`${API_URL}/forms-excel`, {
          params: { date, productionRole, productId },
          responseType: 'blob',
          headers: getAuthHeader()
        });
        return response.data;
      },
    

    getProjectTargets: async (deliveryNumber: number, productId: number): Promise<ProjectTargetsResponse> => {
        try {
            const response = await axios.get<ProjectTargetsResponse>(
                `${API_URL}/project-targets/${deliveryNumber}/${productId}`,
                {
                    headers: getAuthHeader()
                }
            );
            console.log('Project targets:', response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new Error(`No approved assignments found for delivery number ${deliveryNumber} and product ID ${productId}`);
            }
            throw error;
        }
    },

    GetWeeklyTargetsWithActuals: async (
        startDate: string,
        endDate: string,
        productId: number,
        productionRole: ProductionRole
    ): Promise<WeeklyTargetWithActual[]> => {
        console.log('Getting weekly targets with actuals:', startDate, endDate, productId, productionRole);
        try {
            const response = await axios.get<WeeklyTargetWithActual[]>(
                `${API_URL}/weekly-targets/${startDate}/${endDate}/${productId}/${productionRole}`,
                {
                    headers: getAuthHeader()
                }
            );
            console.log('Weekly targets with actuals:', response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return [];
            }
            throw error;
        }
    },
    GetEditorPerformance: async (taqniaId: number): Promise<EditorPerformanceResponse | null> => {
        try {
            const response = await axios.get<EditorPerformanceResponse>(`${API_URL}/editor-performance/${taqniaId}`, {
                headers: getAuthHeader() // Add auth header
            });
            console.log('Editor performance:', response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    GetProductivityDashboard: async (
        date: string,
        productId: number,
        productionRole: ProductionRole
    ): Promise<ProductivityData> => {
        try {
            const response = await axios.get<ProductivityData>(
                `${API_URL}/productivity/${date}`,
                {
                    params: { productId, productionRole },
                    headers: getAuthHeader()
                }
            );
            console.log('Productivity dashboard data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching productivity dashboard:', error);
            throw error;
        }
    },


    GetFormComments: async (date: string): Promise<FormComment[]> => {
        try {
            const response = await axios.get<FormComment[]>(`${API_URL}/comments/${date}`, {
                headers: getAuthHeader() // Add auth header
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return [];
            }
            throw error;
        }
    },

    GetFormsByDateAndLayer: async (
        date: string,
        layerId: number,
        productId: number,
        productionRole: ProductionRole
    ): Promise<FormByDateAndLayer[]> => {
        try {
            const response = await axios.get<FormByDateAndLayer[]>(
                `${API_URL}/forms/${date}/${layerId}/${productId}/${productionRole}`,
                {
                    headers: getAuthHeader()
                }
            );
            console.log('Forms by date and layer:', response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                console.log('No forms found for the given criteria');
                return [];
            }
            console.error('Error fetching forms by date and layer:', error);
            throw error;
        }
    },
};
