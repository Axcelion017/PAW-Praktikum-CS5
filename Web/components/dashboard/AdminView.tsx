"use client";

import React, { useState, useEffect } from "react";
import { UserSession } from "@/lib/auth/auth";

const DEFAULT_PATIENTS = [
  { id: "P-101", name: "Budi Santoso", room: "Mawar 01", assignedDoctorId: "DOC-01", encryptionKeyHex: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90" },
  { id: "P-102", name: "Siti Rahmawati", room: "Melati 04", assignedDoctorId: "DOC-02", encryptionKeyHex: "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1" },
  { id: "P-103", name: "Ahmad Dahlan", room: "Anggrek 02", assignedDoctorId: "DOC-01", encryptionKeyHex: "c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2" }
];

const DAFTAR_DOKTER = [
  { id: "DOC-01", name: "dr. Andi Pratama, Sp.PD", specialization: "Spesialis Penyakit Dalam" },
  { id: "DOC-02", name: "dr. Ratna Juwita, Sp.JP", specialization: "Spesialis Kardiologi" },
  { id: "DOC-03", name: "dr. Maya Safitri, Sp.A", specialization: "Spesialis Anak" }
];

interface AdminViewProps {
  session: UserSession;
  onLogoutClick: () => void;
}

export default function AdminView({ session, onLogoutClick }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"penugasan" | "audit" | "pengujian">("penugasan");
  const [patients, setPatients] = useState<any[]>(DEFAULT_PATIENTS);
  const [records, setRecords] = useState<any[]>([]);
  
  const [targetPatientId, setTargetPatientId] = useState<string>("P-101");
  const [targetDoctorId, setTargetDoctorId] = useState<string>("DOC-01");
  const [notifSukses, setNotifSukses] = useState<string>("");

  const [auditLog, setAuditLog] = useState<string[]>([
    "Sistem Zero-Trust API Gateway diinisialisasi.",
    "Kebijakan Need-to-Know: Akses teks diagnosa dibatasi hanya untuk Tim Medis terkait."
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPatients = localStorage.getItem("resilio_patients");
      if (storedPatients) {
        try {
          setPatients(JSON.parse(storedPatients));
        } catch {
          setPatients(DEFAULT_PATIENTS);
        }
      } else {
        localStorage.setItem("resilio_patients", JSON.stringify(DEFAULT_PATIENTS));
        setPatients(DEFAULT_PATIENTS);
      }

      const storedRecords = localStorage.getItem("resilio_records");
      if (storedRecords) {
        try {
          setRecords(JSON.parse(storedRecords));
        } catch {
          setRecords([]);
        }
      }
    }
  }, []);

  const handleAssignDoctor = (patientId: string, doctorId: string) => {
    const updated = patients.map((p) => (p.id === patientId ? { ...p, assignedDoctorId: doctorId } : p));
    setPatients(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem("resilio_patients", JSON.stringify(updated));
    }

    const doc = DAFTAR_DOKTER.find((d) => d.id === doctorId);
    const pat = patients.find((p) => p.id === patientId);
    
    setNotifSukses(`Berhasil! ${doc?.name.split(",")[0] || doctorId} kini ditugaskan ke pasien ${pat?.name}.`);
    setTimeout(() => setNotifSukses(""), 4000);

    const newEntry = `[${new Date().toLocaleTimeString()}] ADMIN: Menugaskan ${doc?.name || doctorId} ke Pasien ${pat?.name || patientId}`;
    setAuditLog((prev) => [newEntry, ...prev]);
  };

  const handleSimulasiSeranganHMAC = (recordId: string) => {
    const updated = records.map((r: any) => {
      if (r.recordId === recordId) {
        return { ...r, encryptedPayload: r.encryptedPayload + "MODIFIKASI_ILEGAL" };
      }
      return r;
    });
    setRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("resilio_records", JSON.stringify(updated));
    }

    const newEntry = `[${new Date().toLocaleTimeString()}] SIMULASI: Manipulasi paksa pada Record ${recordId}. Verifikasi HMAC pada sesi pasien/dokter akan gagal!`;
    setAuditLog((prev) => [newEntry, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-28 md:pb-8">
      {/* 1. TOP BAR PUTIH ADMIN */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-red-200">
            R
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none">
              RESILIO-HEALTH
            </h1>
            <p className="text-[9px] sm:text-[10px] text-red-600 font-extrabold uppercase tracking-wider mt-0.5">
              Pusat Kendali Admin
            </p>
          </div>
        </div>

        {/* KARTU PROFIL ADMIN */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 px-2.5 sm:p-2 sm:px-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-left">
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Administrator
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-none">
              {session.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold hidden md:inline">
                Zero-Trust Gateway
              </span>
              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black rounded-full uppercase">
                ID: {session.id}
              </span>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm active:scale-95"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* 2. AREA KONTEN UTAMA */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* SIDEBAR ADMIN (TABLET / DESKTOP) */}
        <aside className="hidden md:flex w-60 lg:w-64 bg-white border-r border-slate-200 p-4 flex-col space-y-2 shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">
            Menu Navigasi
          </p>

          <button
            onClick={() => setActiveTab("penugasan")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between ${
              activeTab === "penugasan"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>Penugasan Dokter</span>
            {activeTab === "penugasan" && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between ${
              activeTab === "audit"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>Log Akses Gateway</span>
            {activeTab === "audit" && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>

          <button
            onClick={() => setActiveTab("pengujian")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between ${
              activeTab === "pengujian"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>Simulasi Uji HMAC</span>
            {activeTab === "pengujian" && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>
        </aside>

        {/* ISI FITUR ADMIN */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full space-y-6">
          {activeTab === "penugasan" && (
            <>
              {notifSukses && (
                <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold shadow-sm animate-fade-in flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-black text-xs">
                    ✓
                  </span>
                  <span>{notifSukses}</span>
                </div>
              )}

              {/* FORM PENUGASAN CEPAT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1">
                  Formulir Penugasan Dokter Penanggung Jawab
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mb-4">
                  Otorisasikan dokter yang berhak mengakses dan mengisi rekam medis pasien sesuai protokol Zero-Trust.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-end bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase mb-1">
                      1. Pilih Pasien:
                    </label>
                    <select
                      value={targetPatientId}
                      onChange={(e) => setTargetPatientId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id}) - Ruang {p.room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase mb-1">
                      2. Dokter Penanggung Jawab:
                    </label>
                    <select
                      value={targetDoctorId}
                      onChange={(e) => setTargetDoctorId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                    >
                      {DAFTAR_DOKTER.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 md:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleAssignDoctor(targetPatientId, targetDoctorId)}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md shadow-red-600/20 transition-all text-center active:scale-95"
                    >
                      Tugaskan Dokter Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* TABEL PASIEN & ASSIGNMENT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Daftar Pasien & Penugasan Langsung
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Dapat diubah langsung via dropdown tabel
                  </span>
                </div>

                <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[560px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] sm:text-xs text-slate-400 uppercase font-black">
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">Nama Pasien</th>
                        <th className="py-3 px-3">Kamar</th>
                        <th className="py-3 px-3">Dokter Ditugaskan</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {patients.map((p: any) => {
                        const currentDoc = DAFTAR_DOKTER.find((d) => d.id === p.assignedDoctorId);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">{p.id}</td>
                            <td className="py-3 px-3 font-extrabold text-slate-900">{p.name}</td>
                            <td className="py-3 px-3 font-semibold text-slate-600">{p.room}</td>
                            
                            <td className="py-3 px-3">
                              <select
                                value={p.assignedDoctorId}
                                onChange={(e) => handleAssignDoctor(p.id, e.target.value)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                              >
                                {DAFTAR_DOKTER.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} ({d.specialization})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-3 px-3">
                              <span className="text-[10px] sm:text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
                                Aktif: {currentDoc?.name.split(",")[0] || p.assignedDoctorId}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "audit" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Catatan Aktivitas Zero-Trust API Gateway
              </h3>
              <div className="space-y-2">
                {auditLog.map((log, index) => (
                  <div key={index} className="p-3 sm:p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] sm:text-xs border border-slate-800 break-words">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "pengujian" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Pengujian Keamanan: Simulasi Manipulasi Data (BOLA / Tampering)
              </h3>
              {records.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500 font-semibold py-4">Belum ada rekam medis tersimpan.</p>
              ) : (
                records.map((r: any) => (
                  <div key={r.recordId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 gap-2.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">{r.recordId}</span>
                      <p className="text-[11px] text-slate-500 font-semibold">Pasien: {r.patientId}</p>
                    </div>
                    <button
                      onClick={() => handleSimulasiSeranganHMAC(r.recordId)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all w-full sm:w-auto text-center active:scale-95"
                    >
                      Simulasi Manipulasi Ciphertext
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* 3. BOTTOM NAVIGATION KHUSUS PONSEL (ADMIN) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center md:hidden z-40 shadow-lg">
        <button
          onClick={() => setActiveTab("penugasan")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-extrabold transition-all ${
            activeTab === "penugasan" ? "text-red-600 font-black" : "text-slate-500"
          }`}
        >
          <span>Penugasan</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-extrabold transition-all ${
            activeTab === "audit" ? "text-red-600 font-black" : "text-slate-500"
          }`}
        >
          <span>Audit</span>
        </button>
        <button
          onClick={() => setActiveTab("pengujian")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-extrabold transition-all ${
            activeTab === "pengujian" ? "text-red-600 font-black" : "text-slate-500"
          }`}
        >
          <span>Uji HMAC</span>
        </button>
        <button
          onClick={onLogoutClick}
          className="flex flex-col items-center py-1 px-3 text-[11px] font-extrabold text-red-600"
        >
          <span>Keluar</span>
        </button>
      </nav>
    </div>
  );
}