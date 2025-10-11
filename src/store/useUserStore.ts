"use client";
import { create } from "zustand";

type User = {
  id: string;
  username: string;
  role?: string;
};

interface UserStore {
  user: User | null;
  token: string | null;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
  loadFromStorage: () => {
    const u = localStorage.getItem("user");
    const t = localStorage.getItem("token");
    set({
      user: u ? JSON.parse(u) : null,
      token: t || null,
    });
  },
}));
