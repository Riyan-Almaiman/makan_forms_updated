import axios from 'axios';
import { Layer, Remark, Product } from '../types';
import { URL } from '../../config';
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function

const API_URL = `${URL}/api`;

export const entityService = {
  // Layer endpoints
  getAllLayers: async (): Promise<Layer[]> => {
    const response = await axios.get<Layer[]>(`${API_URL}/layers`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  getLayerById: async (id: number): Promise<Layer> => {
    const response = await axios.get<Layer>(`${API_URL}/layers/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  createLayer: async (layer: Layer): Promise<Layer> => {
    const response = await axios.post<Layer>(`${API_URL}/layers`, layer, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  updateLayer: async (id: number, layer: Layer): Promise<void> => {
    await axios.put(`${API_URL}/layers/${id}`, layer, {
      headers: getAuthHeader() // Add auth header
    });
  },

  deleteLayer: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/layers/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },

  // Remark endpoints
  getAllRemarks: async (): Promise<Remark[]> => {
    const response = await axios.get<Remark[]>(`${API_URL}/remarks`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  getRemarkById: async (id: number): Promise<Remark> => {
    const response = await axios.get<Remark>(`${API_URL}/remarks/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  createRemark: async (remark: Remark): Promise<Remark> => {
    const response = await axios.post<Remark>(`${API_URL}/remarks`, remark, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  updateRemark: async (id: number, remark: Remark): Promise<void> => {
    await axios.put(`${API_URL}/remarks/${id}`, remark, {
      headers: getAuthHeader() // Add auth header
    });
  },

  deleteRemark: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/remarks/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },


  deleteTargetType: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/targettypes/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },

  // Product endpoints
  getAllProducts: async (): Promise<Product[]> => {
    const response = await axios.get<Product[]>(`${API_URL}/products`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await axios.get<Product>(`${API_URL}/products/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  createProduct: async (product: Product): Promise<Product> => {
    const response = await axios.post<Product>(`${API_URL}/products`, product, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  updateProduct: async (id: number, product: Product): Promise<void> => {
    await axios.put(`${API_URL}/products/${id}`, product, {
      headers: getAuthHeader() // Add auth header
    });
  },

  deleteProduct: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/products/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },
};
