import axios from 'axios';
import { SheetAssignment } from '../types';
import { URL } from '../../config';
import { getAuthHeader } from '../../config';

const API_URL = `${URL}/api/sheetassignments`;

export const sheetAssignmentService = {
  // Existing functions...

  // Get all sheet assignments
  getAllSheetAssignments: async (): Promise<SheetAssignment[]> => {
    try {
      const response = await axios.get<SheetAssignment[]>(API_URL, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all sheet assignments:', error);
      throw new Error('Failed to fetch all sheet assignments');
    }
  },

  // Get sheet assignments by Sheet ID
  getSheetAssignmentsBySheetId: async (sheetId: number): Promise<SheetAssignment[]> => {
    try {
      const response = await axios.get<SheetAssignment[]>(`${API_URL}/sheet/${sheetId}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching sheet assignments for Sheet ID ${sheetId}:`, error);
      throw new Error(`Failed to fetch sheet assignments for Sheet ID ${sheetId}`);
    }
  },

  // Get sheet assignments by User ID
  getSheetAssignmentsByUserId: async (userId: number): Promise<SheetAssignment[]> => {
    try {
      const response = await axios.get<SheetAssignment[] | { data: SheetAssignment[] }>(`${API_URL}/user/${userId}`, {
        headers: getAuthHeader(),
      });
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (typeof response.data === 'object' && response.data !== null && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Unexpected response structure:', response.data);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error(`Error fetching sheet assignments for User ID ${userId}:`, error);
      throw error;
    }
  },

  // Create new sheet assignment
  createAssignment: async (assignment: Partial<SheetAssignment>): Promise<SheetAssignment> => {
    try {
      const response = await axios.post(API_URL, assignment, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating sheet assignment:', error);
      throw error;
    }
  },

  // Update sheet assignment
  updateSheetAssignment: async (
    sheetAssignmentId: number,
    updatedAssignment: Partial<SheetAssignment>
  ): Promise<void> => {
    try {
      await axios.put(`${API_URL}/${sheetAssignmentId}`, updatedAssignment, {
        headers: getAuthHeader(),
      });
    } catch (error) {
      console.error(
        `Error updating sheet assignment with ID ${sheetAssignmentId}:`,
        error
      );
      throw new Error('Failed to update sheet assignment');
    }
  },

  // Delete sheet assignment
  deleteSheetAssignment: async (sheetAssignmentId: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/${sheetAssignmentId}`, {
        headers: getAuthHeader(),
      });
    } catch (error) {
      console.error(
        `Error deleting sheet assignment with ID ${sheetAssignmentId}:`,
        error
      );
      throw new Error('Failed to delete sheet assignment');
    }
  },

  // New function: Fetch daily sheet assignments
  fetchDailyAssignments: async (taqniaIds: number[], date: string, layerId: number) => {
    console.log(`Fetching daily assignments for TaqniaIDs:`, taqniaIds, `on date:`, date);
    try {
      const response = await axios.post(`${API_URL}/dailysheetassignments`, {
        TaqniaIDs: taqniaIds,
        Date: date,
        LayerId: layerId
      }, {
        headers: getAuthHeader()
      });
      
      console.log(`Daily assignments summary for date ${date}:`, response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log(`No assignments found for the provided TaqniaIDs on ${date}`);
          return {};
        }
        console.error(`Error fetching daily assignments:`, error.response?.data);
      } else {
        console.error(`Unexpected error fetching daily assignments:`, error);
      }
      throw error;
    }
  }
};