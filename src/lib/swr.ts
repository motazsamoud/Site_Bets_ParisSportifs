import useSWR from "swr";
import { get } from "./api";

export function useGet<T>(key: string | null, params?: any) {
  return useSWR<T>(key ? [key, params] : null, ([url, p]) => get<T>(url, p));
}
