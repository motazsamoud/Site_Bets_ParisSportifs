/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";

export const userApi = axios.create({
  baseURL: `${BACKEND_BASE}/user`,
  timeout: 10_000,
});

// ✅ Inject token automatiquement s’il existe
userApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ----------------------------------------------------------------
   🔹 AUTHENTIFICATION
------------------------------------------------------------------ */

export async function signupUser(data: {
  email: string;
  password: string;
  username: string;
  dateOfBirth: string;
  role?: string;
}) {
  const res = await userApi.post("/signup", data);
  return res.data;
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await userApi.post("/login", data);
  if (res.data?.access_token) {
    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function logoutUser() {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await userApi.post("/logout"); // si la route existe côté backend
    }
  } catch {
    console.warn("⚠️ Déconnexion locale (pas de route backend)");
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}


/* ----------------------------------------------------------------
   🔹 OTP (vérification email)
------------------------------------------------------------------ */

export async function sendOtp(email: string) {
  const res = await userApi.post("/send-otp", { email });
  return res.data;
}

export async function verifyOtp(identifier: string, otp: string) {
  const res = await userApi.post("/verify-otp", { identifier, otp });
  return res.data;
}

export async function resendOtp(email: string) {
  const res = await userApi.post("/resend-otp", { email });
  return res.data;
}

/* ----------------------------------------------------------------
   🔹 MOT DE PASSE
------------------------------------------------------------------ */

export async function forgetPassword(email: string) {
  const res = await userApi.post("/forget-password", { email });
  return res.data;
}

export async function verifyTempPassword(email: string, tempPassword: string) {
  const res = await userApi.post("/verify-temp-password", {
    email,
    tempPassword,
  });
  return res.data;
}

export async function updatePassword(data: {
  userId: string;
  newPassword: string;
}) {
  const res = await userApi.patch("/update-password", data);
  return res.data;
}

/* ----------------------------------------------------------------
   🔹 PROFIL UTILISATEUR
------------------------------------------------------------------ */

export async function getAllUsers() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Aucun token trouvé");

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/user/get`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur backend (${res.status}): ${msg}`);
  }

  return res.json();
}


export async function getUserById(id: string) {
  const res = await userApi.get(`/${id}`);
  return res.data;
}

export async function findByEmail(email: string) {
  const res = await userApi.get(`/find-by-email/${email}`);
  return res.data;
}

export async function updateUser(id: string, data: any) {
  const res = await userApi.patch(`/update`, { id, ...data });
  return res.data;
}

export async function deleteUser(id: string) {
  const res = await userApi.delete(`/${id}`);
  return res.data;
}

/* ----------------------------------------------------------------
   🔹 ROLES & STATUT
------------------------------------------------------------------ */

export async function updateUserRole(id: string, role: string) {
  const res = await userApi.patch(`/${id}/role`, { role });
  return res.data;
}

export async function updateUserStatus(id: string, status: string) {
  const res = await userApi.patch(`/${id}/status`, { status });
  return res.data;
}

export async function checkUserStatus(identifier: string) {
  const res = await userApi.post(`/status`, { identifier });
  return res.data;
}

/* ----------------------------------------------------------------
   🔹 PORTFOLIO / PROFIL
------------------------------------------------------------------ */

export async function updateProfile(id: string, data: any) {
  const res = await userApi.patch(`/${id}/profile`, data);
  return res.data;
}

export async function addPortfolio(id: string, data: {
  titre: string;
  lien?: string;
  description?: string;
}) {
  const res = await userApi.patch(`/${id}/add-portfolio`, data);
  return res.data;
}

/* ----------------------------------------------------------------
   🔹 DIVERS : Vérification diplôme (OCR)
------------------------------------------------------------------ */

export async function verifyDiploma(imageBase64: string, lang: string) {
  const res = await userApi.post("/verify-diploma", { imageBase64, lang });
  return res.data;
}
