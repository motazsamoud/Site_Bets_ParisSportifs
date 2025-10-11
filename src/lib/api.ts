import axios from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000/api/odds";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
});

export async function get<T>(url: string, params?: any): Promise<T> {
  const { data } = await api.get(url, { params });
  return data;
}
