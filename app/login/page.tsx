"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Moon, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Pendaftaran berhasil! Silakan cek inbox email asli Anda untuk mengklik link verifikasi sebelum login.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-2">
            <Moon className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSignUp ? "Buat Akun Mutaba'ah" : "Selamat Datang Kembali"}
          </h1>
          <p className="text-sm text-slate-500">
            {isSignUp
              ? "Mulai pantau amalan harianmu sekarang"
              : "Masuk untuk melanjutkan catat ibadah harian"}
          </p>
        </div>

        {message && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="h-5 w-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Memproses..." : isSignUp ? "Daftar Akun" : "Masuk"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage("");
            }}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            {isSignUp
              ? "Sudah punya akun? Masuk di sini"
              : "Belum punya akun? Daftar gratis"}
          </button>
        </div>
      </div>
    </div>
  );
}