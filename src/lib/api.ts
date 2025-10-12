import axios from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://odds-backend-fkh4.onrender.com/api/odds";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000, // Render est lent à froid
});

export async function get<T>(url: string, params?: any): Promise<T> {
  const { data } = await api.get(url, { params });
  return data;
}
