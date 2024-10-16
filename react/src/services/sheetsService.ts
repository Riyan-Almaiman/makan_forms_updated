import axios from 'axios';
import { Sheet } from '../types';  // Assuming you have a types file with your interfaces
import { URL } from '../../config';  // Importing the base URL
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function

const API_URL = `${URL}/api/sheets`;

export const sheetService = {
  // Get all sheets
  getAllSheets: async (): Promise<Sheet[]> => {
    const response = await axios.get<Sheet[]>(API_URL, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Get sheet by ID
  getSheetById: async (id: number): Promise<Sheet> => {
    const response = await axios.get<Sheet>(`${API_URL}/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },
  searchSheets: async (searchTerm: string, limit: number = 20): Promise<Sheet[]> => {
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { searchTerm, limit },
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error searching sheets:', error);
      throw error;
    }
  },
  // Get sheets by delivery number
  getSheetsByDeliveryNumber: async (deliveryNumber: number): Promise<Sheet[]> => {
    const response = await axios.get<Sheet[]>(`${API_URL}/delivery/${deliveryNumber}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Get sheets by progress status
  getSheetsByProgress: async (status: boolean): Promise<Sheet[]> => {
    const response = await axios.get<Sheet[]>(`${API_URL}/inprogress/${status}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Create new sheet
  createSheet: async (sheet: Sheet): Promise<Sheet> => {
    const response = await axios.post<Sheet>(API_URL, sheet, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Update sheet
  updateSheet: async (id: number, sheet: Sheet): Promise<void> => {
    await axios.put(`${API_URL}/${id}`, sheet, {
      headers: getAuthHeader() // Add auth header
    });
  },

  // Delete sheet
  deleteSheet: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },
};
