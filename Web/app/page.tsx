"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth/auth";
import { Montserrat } from "next/font/google";
import "./globals.css";




export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const success = loginUser(username, password);
    if (success) {
      router.replace("/beranda");
    } else {
      setErrorMsg("Kredensial tidak valid. Silakan gunakan tombol demo di bawah.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    const success = loginUser(u, p);
    if (success) {
      router.replace("/beranda");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 font-sans text-slate-800">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 transition-all">
        {/* LOGO & BRANDING */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shadow-red-200 mb-3 sm:mb-4">
            R
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            RESILIO-HEALTH
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
            Sistem Informasi Rumah Sakit & Rekam Medis
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-fade-in">
            {errorMsg}
          </div>
        )}

        {/* FORMULIR LOGIN */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Nama Pengguna (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="dr_andi, budi, admin"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Kata Sandi (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-red-600/30 transition-all mt-2 active:scale-[0.99]"
          >
            {isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}
          </button>
        </form>

        {/* AKSES CEPAT PENGUJIAN */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center mb-3">
            Akses Cepat Pengujian Role
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("dr_andi", "doctor123")}
              className="py-2.5 px-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-extrabold text-slate-700 transition-all text-center border border-slate-200 active:scale-95"
            >
              Dokter
            </button>
            <button
              onClick={() => handleQuickLogin("budi", "patient123")}
              className="py-2.5 px-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-extrabold text-slate-700 transition-all text-center border border-slate-200 active:scale-95"
            >
              Pasien
            </button>
            <button
              onClick={() => handleQuickLogin("admin", "admin123")}
              className="py-2.5 px-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-extrabold text-slate-700 transition-all text-center border border-slate-200 active:scale-95"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}