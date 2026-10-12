"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { SEED_USERS } from "@/core/storage/seed-data";
import { Shield, Lock, Mail, ArrowRight, UserCheck, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useAuth();
  const { language, setLanguage, t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuickRole, setSelectedQuickRole] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(language === "fr" ? "Veuillez saisir votre email professionnel." : "Please enter your work email.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password || "Password123!");
    setLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || (language === "fr" ? "Échec de connexion." : "Authentication failed."));
    }
  };

  const handleSelectQuickUser = async (userEmail: string, roleName: string) => {
    setSelectedQuickRole(roleName);
    setEmail(userEmail);
    setPassword("Password123!");
    setError(null);
    setLoading(true);

    const res = await login(userEmail, "Password123!");
    setLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Bar with Language Toggle */}
      <div className="absolute top-6 right-8 flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">Langue:</span>
        <button
          onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900/80 text-blue-400 hover:bg-slate-800 transition"
        >
          {language === "fr" ? "🇬🇧 English" : "🇫🇷 Français"}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          TelcoQualify <span className="text-blue-500">Enterprise</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {language === "fr"
            ? "Plateforme Commerciale & Qualification Technique Presales Telecom / FAI"
            : "Commercial Solution-Qualification & Presales Telecom Platform"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 rounded-lg bg-rose-950/50 border border-rose-800/80 p-4 text-sm text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {language === "fr" ? "Identifiant Professionnel" : "Work Email Address"}
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commercial@telco-enterprise.fr"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {language === "fr" ? "Mot de Passe" : "Password"}
                </label>
                <span className="text-xs text-slate-500">Demo: Password123!</span>
              </div>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === "fr" ? "Se Connecter" : "Sign In to Workspace"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Access for Testing & Demo */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === "fr" ? "Profils de Démonstration (1-Clic)" : "1-Click Demo Profiles"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {SEED_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectQuickUser(user.email, user.role)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                    selectedQuickRole === user.role
                      ? "bg-blue-950/50 border-blue-500/80 text-white"
                      : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.department}</p>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 flex-shrink-0">
                    {user.role.split("_")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>
            {language === "fr"
              ? "Accès sécurisé réservé au personnel agréé. Conforme OWASP ASVS & RGPD."
              : "Authorized access only. Protected by RBAC & OWASP ASVS Level 2 standards."}
          </p>
        </div>
      </div>
    </div>
  );
}
