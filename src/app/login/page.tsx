"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Loader2, Mail, Lock } from "lucide-react";
import { loginUser } from "@/lib/userApi";
import { useUserStore } from "@/store/useUserStore"; // ✅ ajouté

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useUserStore(); // ✅ ajouté

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.clear();
    console.log("=== 🚀 Tentative de connexion ===");
    console.log("Formulaire envoyé :", form);

    try {
      console.log("📡 Envoi de la requête vers le backend...");
      const res = await loginUser(form);
      console.log("✅ Réponse reçue :", res);

      if (res?.access_token) {
        console.log("🔑 Token reçu :", res.access_token);
        localStorage.setItem("token", res.access_token);
        setToken(res.access_token); // ✅ synchronise avec le store
      } else {
        console.warn("⚠️ Aucun token reçu !");
      }

      if (res?.user) {
        console.log("👤 Utilisateur connecté :", res.user);
        localStorage.setItem("user", JSON.stringify(res.user));
        setUser(res.user); // ✅ synchronise avec le store
      }

      setSuccess(true);
      console.log("🎯 Connexion réussie, redirection...");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      console.error("❌ Erreur complète :", err);

      if (err.response) {
        console.log("🧾 Réponse backend :", err.response.data);
        console.log("📊 Code HTTP :", err.response.status);
      } else if (err.request) {
        console.log("🌐 Aucun retour du serveur (problème réseau ou CORS).");
        console.log("Requête envoyée :", err.request);
      } else {
        console.log("💥 Erreur inconnue :", err.message);
      }

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de la connexion";
      setError(message);
    } finally {
      console.log("🏁 Requête terminée.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1018] text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-[#0a0f17]/70 border border-emerald-500/20 rounded-2xl shadow-[0_0_25px_rgba(0,255,170,0.05)] p-8 backdrop-blur-md"
        >
          <h1 className="text-2xl font-bold text-center mb-6 text-emerald-400">
            Connexion
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">
                Email ou nom d’utilisateur
              </label>
              <div className="flex items-center bg-white/5 rounded-md px-3 py-2 border border-white/10">
                <Mail size={16} className="text-emerald-400 mr-2" />
                <input
                  type="text"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="bg-transparent w-full outline-none text-sm"
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">
                Mot de passe
              </label>
              <div className="flex items-center bg-white/5 rounded-md px-3 py-2 border border-white/10">
                <Lock size={16} className="text-emerald-400 mr-2" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="bg-transparent w-full outline-none text-sm"
                  placeholder="********"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}

            {success && (
              <p className="text-emerald-400 text-xs text-center mt-2">
                ✅ Connexion réussie ! Redirection...
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md py-2 text-sm transition shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>

            <p className="text-center text-xs text-white/60 mt-3">
              Pas encore de compte ?{" "}
              <span
                onClick={() => router.push("/signup")}
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                Créer un compte
              </span>
            </p>

            <p className="text-center text-xs text-white/60 mt-2">
              <span
                onClick={() => router.push("/forgot-password")}
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                Mot de passe oublié ?
              </span>
            </p>
          </form>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
