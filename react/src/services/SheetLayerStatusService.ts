import axios from 'axios';
import { URL } from '../../config';
import { SheetLayerStatus, ProductionRole } from '../types';
import { getAuthHeader } from '../../config';
export interface DailyTargetInfo {
    productionRole?: ProductionRole;
    employeeName?: string;
    taqniaID?: number;
    productivityDate?: string;
  }
  
  export interface SheetLayerStatusWithDailyTargets {
    sheetLayerStatus: SheetLayerStatus;
    sheet: {
      sheetName: string;
      deliveryNumber?: string;
    };
    layer: {
      name: string;
    };
    dailyTargets: Array<{
      productionRole?: ProductionRole;
      employeeName?: string;
      taqniaID?: number;
      productivityDate?: string;
    }>;
  }
  const API_URL = `${URL}/api`;

export const sheetLayerStatusService = {
  // Search sheet layer statuses
  searchSheetLayerStatuses: async (searchTerm: string, layerId: number, productId: number | null, limit: number = 20): Promise<SheetLayerStatus[]> => {
    const response = await axios.get<SheetLayerStatus[]>(`${API_URL}/sheetlayerstatus/search`, {
      params: { searchTerm, layerId, productId, limit },
      headers: getAuthHeader()
    });
    return response.data;
  },
  searchSheetLayerStatusesAcrossLayers: async (searchTerm: string, productId: number | null): Promise<SheetLayerStatusWithDailyTargets[]> => {
    const response = await axios.get<SheetLayerStatusWithDailyTargets[]>(`${API_URL}/sheetlayerstatus/searchacrosslayers`, {
      params: { searchTerm, productId },
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get completed sheet layer statuses

  // Get a specific sheet layer status
  getSheetLayerStatus: async (id: number): Promise<SheetLayerStatus> => {
    const response = await axios.get<SheetLayerStatus>(`${API_URL}/sheetlayerstatus/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Update an existing sheet layer status
  updateSheetLayerStatus: async (id: number, status: Partial<SheetLayerStatus>): Promise<void> => {
    await axios.put(`${API_URL}/sheetlayerstatus/${id}`, status, {
      headers: getAuthHeader()
    });
  },
};