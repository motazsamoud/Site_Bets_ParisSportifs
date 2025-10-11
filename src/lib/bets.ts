const BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:3000";

export async function placeBet(userId: string, slip: any, stake: number) {
  const res = await fetch(`${BASE}/api/bets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, slip, stake }),
  });
  return res.json();
}

export async function getUserBets(userId: string) {
  const res = await fetch(`${BASE}/api/bets?userId=${userId}`);
  return res.json();
}
fetch("https://odds-backend-fkh4.onrender.com/api/bets", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: "demo-user", selections: [], stake: 10 }),
})
  .then((r) => r.status)  
  .then(console.log)
  .catch(console.error);
