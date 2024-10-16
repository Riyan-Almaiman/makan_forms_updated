import axios from 'axios';
import { Form } from '../types'; // Assuming you have a types file with your interfaces
import { URL } from '../../config';
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function

const API_URL = `${URL}/api/forms`; // Base URL for form endpoints

export const formService = {
  // Get all forms
  getAllForms: async (): Promise<Form[]> => {
    const response = await axios.get<Form[]>(API_URL, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getEditorPendingOrRejectedForms: async (editorTaqniaId: number): Promise<Form[]> => {
    try {
      const response = await axios.get<Form[]>(`${API_URL}/editor/${editorTaqniaId}/pending-rejected`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      } else {
        console.error("Error fetching editor's pending or rejected forms:", error);
        throw error;
      }
    }
  },

  // Get form by ID
  getFormById: async (id: number): Promise<Form> => {
    const response = await axios.get<Form>(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Create or Update form
  createOrUpdateForm: async (form: Form): Promise<Form> => {
    const response = await axios.post<Form>(API_URL, form, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Update form
  updateForm: async (id: number, form: Form): Promise<void> => {
    await axios.put(`${API_URL}/${id}`, form, {
      headers: getAuthHeader()
    });
  },

  // Delete form
  deleteForm: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Get forms by user TaqniaID
  getFormsByUserTaqniaId: async (taqniaId: number): Promise<Form[]> => {
    const response = await axios.get<Form[]>(`/api/users/${taqniaId}/forms`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get user form by date
  getUserFormByDate: async (taqniaId: number, date: string): Promise<Form | null> => {
    try {
      const response = await axios.get<Form>(`${API_URL}/user/${taqniaId}/date/${date}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      } else {
        console.error("Error fetching user form by date:", error);
        throw error;
      }
    }
  },

  // Get supervisor forms by date
  getSupervisorFormsByDate: async (supervisorTaqniaId: number, date: string): Promise<Form[]> => {
    const response = await axios.get<Form[]>(`${API_URL}/supervisor/${supervisorTaqniaId}/date/${date}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get supervisor pending forms
  getSupervisorPendingForms: async (supervisorTaqniaId: number): Promise<Form[]> => {
    const response = await axios.get<Form[]>(`${API_URL}/supervisor/${supervisorTaqniaId}/pending`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};
