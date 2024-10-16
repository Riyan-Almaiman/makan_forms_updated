// src/services/calculationService.ts

import axios from 'axios';
import { Calculation } from '../types';
import { URL } from '../../config';
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function

const API_URL = `${URL}/api/calculations`;

export const calculationService = {
  // Get all calculations
  getAllCalculations: async (): Promise<Calculation[]> => {
    const response = await axios.get<Calculation[]>(API_URL, {
      headers: getAuthHeader() // Add auth header
    });
    console.log(response.data);
    return response.data;
  },

  // Get a specific calculation by ID
  getCalculationById: async (id: number): Promise<Calculation> => {
    const response = await axios.get<Calculation>(`${API_URL}/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Create a new calculation
  createCalculation: async (calculation: Calculation): Promise<Calculation> => {
    const response = await axios.post<Calculation>(API_URL, calculation, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Update an existing calculation by ID
  updateCalculation: async (id: number, calculation: Calculation): Promise<void> => {
    await axios.put(`${API_URL}/${id}`, calculation, {
      headers: getAuthHeader() // Add auth header
    });
  },

  // Delete a calculation by ID
  deleteCalculation: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  }
};
