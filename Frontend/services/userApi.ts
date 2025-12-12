import axios from "@/lib/axios";
import { API_BASE_URL } from "@/services/api";
export const loginApi = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE_URL}/users/login`, {
    email,
    password,
  });

  return res.data.data;
};

export const registerApi = async (
  name: string,
  email: string,
  password: string
) => {
  const res = await axios.post(`${API_BASE_URL}/users/register`, {
    name,
    email,
    password,
  });
  return res.data;
};

export const fetchUserApi = async () => {
  const res = await axios.get(`${API_BASE_URL}/users/me`);
  return res.data.user;
};

export const refreshTokenApi = async () => {
  const res = await axios.post(`${API_BASE_URL}/users/refresh-token`);
  return res.data.accessToken;
};
