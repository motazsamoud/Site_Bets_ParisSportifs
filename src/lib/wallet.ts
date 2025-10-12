// 📁 app/api/wallet.ts
const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "https://odds-backend-fkh4.onrender.com";

/** 🔹 Récupère le wallet de l'utilisateur connecté */
export async function getWallet() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Aucun token trouvé");

  const res = await fetch(`${BASE}/api/wallet`, {
    method: "GET",
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
export async function adminCredit(targetUserId: string, amount: number) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Aucun token trouvé");

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/wallet/admin/credit`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetUserId, amount }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur backend (${res.status}): ${msg}`);
  }

  return res.json();
}

/** 🔹 Ajoute 1 000 000 TND (faucet de test) */
export async function faucetWallet() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Aucun token trouvé");

  const res = await fetch(`${BASE}/api/wallet/faucet`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: 1000000 }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur backend (${res.status}): ${msg}`);
  }

  return res.json();
}
