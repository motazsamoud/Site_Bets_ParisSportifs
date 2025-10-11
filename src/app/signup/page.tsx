"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Loader2, Mail, Lock, User, Calendar } from "lucide-react";
import { signupUser } from "@/lib/userApi";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signupUser({ ...form, role: "user" });
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur d’inscription");
    } finally {
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
            Créer un compte
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">Email</label>
              <div className="flex items-center bg-white/5 rounded-md px-3 py-2 border border-white/10">
                <Mail size={16} className="text-emerald-400 mr-2" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-transparent w-full outline-none text-sm"
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">Nom d’utilisateur</label>
              <div className="flex items-center bg-white/5 rounded-md px-3 py-2 border border-white/10">
                <User size={16} className="text-emerald-400 mr-2" />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="bg-transparent w-full outline-none text-sm"
                  placeholder="Pseudo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">Mot de passe</label>
              <div className="flex items-center bg-white/5 rounded-md px-3 py-2 border border-white/10">
                <Lock size={16} className="text-emerald-400 mr-2" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-transparent w-full outline-none text-sm"
                  placeholder="********"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-1">Date de naissance</label>
              <div className="flex items-center bg-white/5 rounded-md px-3 py-2 border border-white/10">
                <Calendar size={16} className="text-emerald-400 mr-2" />
                <input
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="bg-transparent w-full outline-none text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}

            {success && (
              <p className="text-emerald-400 text-xs text-center mt-2">
                ✅ Inscription réussie ! Redirection...
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md py-2 text-sm transition shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Création...
                </>
              ) : (
                "Créer un compte"
              )}
            </button>

            <p className="text-center text-xs text-white/60 mt-3">
              Déjà un compte ?{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                Connexion
              </span>
            </p>
          </form>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
