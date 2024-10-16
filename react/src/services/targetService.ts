// src/services/targetService.ts

import axios from 'axios';
import { Targets } from '../types';

import {URL} from '../../config'
const API_URL = URL+ '/api/targets';

export const targetService = {
  getAllTargets: async (): Promise<Targets[]> => {
    const response = await axios.get<Targets[]>(API_URL);
    console.log(response.data);
    return response.data;
  },

  getTargetById: async (id: number): Promise<Targets> => {
    const response = await axios.get<Targets>(`${API_URL}/${id}`);
    return response.data;
  },

  createTarget: async (target: Targets): Promise<Targets> => {
    console.log(target)
    const response = await axios.post<Targets>(API_URL, target);
    return response.data;
  },

  updateTarget: async (id: number, target: Targets): Promise<void> => {
    await axios.put(`${API_URL}/${id}`, target);
  },

  deleteTarget: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  }
};