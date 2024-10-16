import axios from 'axios';
import { URL } from '../../config';
import { Layer } from '../types';
import { getAuthHeader } from '../../config'; // Import the getAuthHeader function

const API_URL = `${URL}/api`;

export interface Link {
  id?: number;
  layerId: number;
  link: string;
  weekStart: string;
  layer?: Layer | null;
}

export const linksService = {
  // Get all links
  getAllLinks: async (): Promise<Link[]> => {
    const response = await axios.get<Link[]>(`${API_URL}/links`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Get links by week
  getLinksByWeek: async (date: string): Promise<Link[]> => {
    const response = await axios.get<Link[]>(`${API_URL}/links/week`, {
      params: { date },
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Get a specific link
  getLink: async (id: number): Promise<Link> => {
    const response = await axios.get<Link>(`${API_URL}/links/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Create a new link
  createLink: async (link: Omit<Link, 'id'>): Promise<Link> => {
    const response = await axios.post<Link>(`${API_URL}/links`, link, {
      headers: getAuthHeader() // Add auth header
    });
    return response.data;
  },

  // Update an existing link
  updateLink: async (id: number, link: Omit<Link, 'id'>): Promise<void> => {
    await axios.put(`${API_URL}/links/${id}`, link, {
      headers: getAuthHeader() // Add auth header
    });
  },

  // Delete a link
  deleteLink: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/links/${id}`, {
      headers: getAuthHeader() // Add auth header
    });
  },
};
