/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { User } from '../types';
import { URL } from '../../config';
import { getAuthHeader } from '../../config';
const API_URL = `${URL}/api/users`;
import Cookies from "js-cookie";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface VerifyOTPRequest {
    username: string;
    otp: string;
}

export interface ChangePasswordRequest {
    newPassword: string;
}

export interface SupervisorUpdateRequest {
    supervisorTaqniaID?: number | null;
}

export interface CreateUserRequest {
    username?: string;
    password?: string;
    email: string;
    taqniaID: number;
    role: string;
    product?: string;
    name?: string;
    phoneNumber?: string;
    employeeType?: string;
    supervisorTaqniaID?: number | null;
}

export const userService = {
    initiateLogin: async (username: string, password: string): Promise<{ requiresOTP: boolean; token?: string; message?: string }> => {
        try {
            const response = await axios.post(`${API_URL}/login`, { username, password });

            console.log('Login response:', response.data);

            if (response.data.message === "OTP sent to your email. Please verify to complete login.") {
                return { requiresOTP: true, message: response.data.message };
            }

            if (response.data.token) {
                Cookies.set('token', response.data.token, { expires: 1 });
                return { requiresOTP: false, token: response.data.token, message: response.data.message || "Login successful" };
            }

            throw new Error(response.data.message || "Unexpected response from server");
        } catch (error: any) {
            console.error('Full error object:', error);

            if (axios.isAxiosError(error) && error.response) {
                console.error('Axios error response:', error.response.data);
                throw new Error(error.response.data.message);
            } else if (error instanceof Error) {
                throw error;
            } else {
                throw new Error('An unexpected error occurred');
            }
        }
    },
    verifyOTP: async (username: string, otp: string): Promise<void> => {
        try {
            const response = await axios.post(`${API_URL}/verify-otp`, { username, otp });
            if (response.data && response.data.token) {
                Cookies.set('token', response.data.token, { expires: 1 });
            } else {
                throw new Error(response.data.message || 'Invalid response from server');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data.message || 'OTP verification failed');
            }
            throw error;
        }
    }, isOTPEnabled: async (): Promise<boolean> => {
        try {
            const response = await axios.get(`${API_URL}/otp-status`, {
                headers: getAuthHeader()
            });
            return response.data.otpEnabled;
        } catch (error) {
            console.error('Error checking OTP status:', error);
            throw new Error('Failed to check OTP status');
        }
    },

    toggleOTP: async (): Promise<void> => {
        try {
            console.log('Toggling OTP');
            await axios.post(`${API_URL}/toggle-otp`, {}, {
                headers: getAuthHeader()
            });
        } catch (error) {
            console.error('Error toggling OTP:', error);
            throw new Error('Failed to toggle OTP');
        }
    },
    getCurrentUser: async (): Promise<User> => {
        try {
            const response = await axios.get(`${API_URL}/me`, {
                headers: getAuthHeader()
            });
            localStorage.setItem('user', JSON.stringify(response.data.taqniaID));
            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            Cookies.remove('token'); // Remove the token if the request fails
            throw new Error('Failed to get current user');
        }
    },
    updateSupervisor: async (taqniaId: number, supervisorTaqniaID: number | null): Promise<void> => {
        await axios.put(`${API_URL}/${taqniaId}/supervisor`, { supervisorTaqniaID }, {
            headers: getAuthHeader()
        });
    },

    getFullUserByTaqniaId: async (taqniaId: number): Promise<User> => {
        try {
            const response = await axios.get<User>(`${API_URL}/full/${taqniaId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching full user data:', error);
            throw new Error('Failed to fetch full user data');
        }
    },
    changePassword: async (newPassword: string): Promise<void> => {
        await axios.put(`${API_URL}/password`, { newPassword }, {
            headers: getAuthHeader()
        });
    },

    getAllUsers: async (): Promise<User[]> => {
        const response = await axios.get<User[]>(API_URL, {
            headers: getAuthHeader()
        });
        return response.data;
    },


    getUsersByRole: async (role: string): Promise<User[]> => {
        const response = await axios.get<User[]>(`${API_URL}/role/${role}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    createUser: async (user: Partial<User>): Promise<User> => {
        const response = await axios.post<User>(API_URL, user, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateUser: async (taqniaId: number, user: Partial<User>): Promise<void> => {
        await axios.put(`${API_URL}/${taqniaId}`, user, {
            headers: getAuthHeader()
        });
    },

    deleteUser: async (taqniaId: number): Promise<void> => {
        await axios.delete(`${API_URL}/${taqniaId}`, {
            headers: getAuthHeader()
        });
    }
};