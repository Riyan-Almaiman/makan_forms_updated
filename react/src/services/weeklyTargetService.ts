import axios from 'axios';
import { WeeklyTarget, Layer, Product, ProductionRole } from '../types';
import { URL } from '../../config';
import { getAuthHeader } from '../../config';

export interface DailyTargets {
  targetId: number;
  layerId: number;
  layer: Layer;
  productId: number;
  product: Product;
  productionRole: ProductionRole;
  amount: number | null;
  date: string;
}

const API_URL = `${URL}/api/weekly-targets`;

export const weeklyTargetService = {
  // Get all weekly targets
  getAllWeeklyTargets: async (): Promise<WeeklyTarget[]> => {
    const response = await axios.get<WeeklyTarget[]>(API_URL, {
      headers: getAuthHeader()
    });
    return response.data;
  },


  // Get weekly targets by product, production role, and week
  getWeeklyTargetsByProductRoleAndWeek: async (productId: number, productionRole: ProductionRole, date: string): Promise<WeeklyTarget[]> => {
    console.log('getWeeklyTargetsByProductRoleAndWeek', productId, productionRole, date);
    const response = await axios.get<WeeklyTarget[]>(`${API_URL}/product/${productId}/role/${productionRole}/week`, {
      params: { date },
      headers: getAuthHeader()
    });
    return response.data;
  },


  // Create or update a weekly target
  createOrUpdateWeeklyTarget: async (weeklyTarget: Omit<WeeklyTarget, 'id'>): Promise<WeeklyTarget> => {
    const response = await axios.post<WeeklyTarget>(`${API_URL}/createOrUpdate`, weeklyTarget, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get daily targets by date
// Get daily targets by date and production role
getDailyTargets: async (date: string, productionRole: ProductionRole): Promise<DailyTargets[]> => {
  const response = await axios.get<DailyTargets[]>(`${API_URL}/daily-targets`, {
    params: { date, productionRole }, // Pass productionRole as a query param
    headers: getAuthHeader()
  });
  return response.data;
},


};

export default weeklyTargetService;