import axios from 'axios';
import { URL } from '../../config';
import { getAuthHeader } from '../../config';

const API_URL = `${URL}/api/attendance`;

// Types for the API response
type PunchData = {
  device_id: number;
  id: number;
  timestamp: string;
  transaction_type: number;
};

type UserAttendance = {
  first_punch: PunchData;
  last_punch: PunchData;
};

type BulkAttendanceResponse = {
  [userId: string]: UserAttendance;
};

export const attendanceService = {
  getFirstLast: async (userId: string, date: string): Promise<UserAttendance | null> => {
    try {
      const response = await axios.get<UserAttendance>(`${API_URL}/first-last/${userId}`, {
        params: { date },
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return null;
    }
  },

  getBulkAttendance: async (userIds: string[], date: string): Promise<BulkAttendanceResponse> => {
    try {
      const response = await axios.post<BulkAttendanceResponse>(`${API_URL}/bulk-first-last`, {
        userIds,
        date
      }, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bulk attendance data:', error);
      return {};
    }
  }
};