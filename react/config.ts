import Cookies from "js-cookie";

export const URL = process.env.API_URL;

export const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};