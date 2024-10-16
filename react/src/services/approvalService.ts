// src/services/approvalService.ts

import axios from 'axios';
import { Approval } from '../types';
import { URL } from '../../config';
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function

const API_URL = `${URL}/api/approvals`;

export const approvalService = {
  getAllApprovals: async (): Promise<Approval[]> => {
    const response = await axios.get<Approval[]>(API_URL, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  getApprovalById: async (id: number): Promise<Approval> => {
    const response = await axios.get<Approval>(`${API_URL}/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  createApproval: async (approval: Approval): Promise<Approval> => {
    const response = await axios.post<Approval>(API_URL, approval, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },
  updateApproval: async (formId: number, isApproved: boolean, comment: string): Promise<void> => {
    await axios.put(
      `${API_URL}/update`,
      { formId, isApproved, comment },
      {
        headers: getAuthHeader()
      }
    );
  },



  deleteApproval: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },

  getApprovalsBySupervisor: async (taqniaId: string): Promise<Approval[]> => {
    const response = await axios.get<Approval[]>(`${API_URL}/supervisor/${taqniaId}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  getPendingApprovals: async (): Promise<Approval[]> => {
    const response = await axios.get<Approval[]>(`${API_URL}/pending`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  }
};
