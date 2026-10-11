"use client";

import React, { useState, useEffect } from "react";
import { encryptAES } from "@/lib/crypto/aes";
import { generateHMAC } from "@/lib/crypto/hmac";
import { UserSession } from "@/lib/auth/auth";

const DEFAULT_PATIENTS = [
  { id: "P-101", name: "Budi Santoso", room: "Mawar 01", assignedDoctorId: "DOC-01", encryptionKeyHex: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90" },
  { id: "P-102", name: "Siti Rahmawati", room: "Melati 04", assignedDoctorId: "DOC-02", encryptionKeyHex: "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1" },
  { id: "P-103", name: "Ahmad Dahlan", room: "Anggrek 02", assignedDoctorId: "DOC-01", encryptionKeyHex: "c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2" }
];

const MOCK_DOCTORS = [
  { id: "DOC-01", name: "dr. Andi Pratama, Sp.PD", specialization: "Penyakit Dalam" },
  { id: "DOC-02", name: "dr. Ratna Juwita, Sp.JP", specialization: "Kardiologi" }
];

interface DokterViewProps {
  session: UserSession;
  onLogoutClick: () => void;
}

export default function DokterView({ session, onLogoutClick }: DokterViewProps) {
  const [activeTab, setActiveTab] = useState<"input" | "riwayat" | "grafik">("input");
  const [patients, setPatients] = useState<any[]>(DEFAULT_PATIENTS);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("P-101");
  
  // Form input rekam medis klinis
  const [keluhan, setKeluhan] = useState<string>("");
  const [diagnosa, setDiagnosa] = useState<string>("");
  const [resep, setResep] = useState<string>("");
  const [sistolik, setSistolik] = useState<number>(120);
  const [diastolik, setDiastolik] = useState<number>(80);
  const [suhu, setSuhu] = useState<number>(36.5);
  const [detakJantung, setDetakJantung] = useState<number>(75);
  const [statusPenyimpanan, setStatusPenyimpanan] = useState<string>("");
  const [lastSavedRecord, setLastSavedRecord] = useState<any | null>(null);

  // Muat data penugasan dari admin & data rekam medis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Ambil data pasien (sinkron dengan penugasan dari admin)
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

      // 2. Ambil data rekam medis
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

  const selectedPatient = patients.find((p: any) => p.id === selectedPatientId) || patients[0];
  
  // SYARAT MUTLAK: Hanya bisa input jika di-assign oleh Admin ke ID Dokter yang login
  const hasAccess = selectedPatient?.assignedDoctorId === session.id;

  const handleSimpanRekamMedis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !hasAccess) return;

    setStatusPenyimpanan("Melakukan enkripsi data klinis (AES-256-GCM) dan kalkulasi hash integritas (HMAC)...");
    try {
      const payloadPlain = JSON.stringify({
        keluhan,
        diagnosa,
        resep,
        sistolik,
        diastolik,
        suhu,
        detakJantung,
        waktuPeriksa: new Date().toISOString(),
      });

      const { ciphertext, iv } = await encryptAES(payloadPlain, selectedPatient.encryptionKeyHex);
      const hmacDigest = await generateHMAC(ciphertext, selectedPatient.encryptionKeyHex);

      const newRecord = {
        recordId: `REC-${Date.now()}`,
        patientId: selectedPatient.id,
        doctorId: session.id,
        timestamp: new Date().toISOString(),
        encryptedPayload: ciphertext,
        ivHex: iv,
        hmacDigest: hmacDigest,
        vitals: {
          sistolik,
          diastolik,
          suhuTubuh: suhu,
          detakJantung,
        },
      };

      const updatedRecords = [newRecord, ...records];
      setRecords(updatedRecords);
      if (typeof window !== "undefined") {
        localStorage.setItem("resilio_records", JSON.stringify(updatedRecords));
      }

      setLastSavedRecord(newRecord);
      setStatusPenyimpanan("Rekam medis berhasil diamankan dengan enkripsi dan tersimpan ke pangkalan data.");
      setKeluhan("");
      setDiagnosa("");
      setResep("");
    } catch {
      setStatusPenyimpanan("Gagal memproses enkripsi data rekam medis.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* TOP BAR PUTIH DENGAN PROFIL DOKTER DI KANAN ATAS */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-200">
            R
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
              RESILIO-HEALTH
            </h1>
            <p className="text-[10px] text-red-600 font-extrabold uppercase tracking-wider mt-0.5">
              Stasiun Tim Medis
            </p>
          </div>
        </div>

        {/* KARTU PROFIL USER DI KANAN ATAS */}
        <div className="flex items-center gap-3">
          <div className="p-2 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Dokter Terautentikasi
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight mt-0.5">
              {session.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">
                {session.specialization || "Spesialis Penyakit Dalam"}
              </span>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase">
                SIP: {session.id}
              </span>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            className="py-2.5 px-3.5 rounded-xl text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* SIDEBAR DOKTER */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-2 shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">
            Menu Navigasi
          </p>

          <button
            onClick={() => setActiveTab("input")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-between ${
              activeTab === "input"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>Input Rekam Medis</span>
            {activeTab === "input" && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>

          <button
            onClick={() => setActiveTab("riwayat")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-between ${
              activeTab === "riwayat"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>Daftar Pasien Bangsal</span>
            {activeTab === "riwayat" && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>

          <button
            onClick={() => setActiveTab("grafik")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-between ${
              activeTab === "grafik"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>Visualisasi Tanda Vital</span>
            {activeTab === "grafik" && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>
        </aside>

        {/* ISI FITUR */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          {activeTab === "input" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-5 gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Formulir Pemeriksaan & Diagnosa Klinis
                    </h3>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                        hasAccess
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {hasAccess ? "Izin Input: Diberikan Admin" : "Izin Input: Terkunci"}
                    </span>
                  </div>

                  {/* PEMILIHAN PASIEN */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Pilih Pasien Pemeriksaan:
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {patients.map((p: any) => {
                        const isAssignedToMe = p.assignedDoctorId === session.id;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.id}) - Ruang {p.room} {isAssignedToMe ? "✓ Ditugaskan ke Anda" : "✗ Belum Ditugaskan"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* KONDISI JIKA TIDAK DI-ASSIGN OLEH ADMIN */}
                  {!hasAccess ? (
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-black text-xs">
                          !
                        </span>
                        <p className="font-extrabold text-sm uppercase tracking-wide">
                          Akses Dibatasi oleh Protokol Zero-Trust HIS
                        </p>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">
                        Anda <strong>tidak diizinkan</strong> memasukkan rekam medis atau diagnosa untuk pasien ini karena pasien saat ini belum ditugaskan kepada Anda oleh Administrator Sistem.
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Silakan hubungi Administrator Sistem untuk menetapkan penugasan penanganan pasien ini kepada akun dokter Anda.
                      </p>
                    </div>
                  ) : (
                    /* FORM INPUT TERBUKA KETIKA DI-ASSIGN */
                    <form onSubmit={handleSimpanRekamMedis} className="space-y-5">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                        Otorisasi Terverifikasi: Anda adalah Dokter Penanggung Jawab aktif untuk pasien ini.
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Keluhan Utama Pasien
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={keluhan}
                          onChange={(e) => setKeluhan(e.target.value)}
                          placeholder="Deskripsikan gejala klinis..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Sistolik (mmHg)
                          </label>
                          <input
                            type="number"
                            value={sistolik}
                            onChange={(e) => setSistolik(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Diastolik (mmHg)
                          </label>
                          <input
                            type="number"
                            value={diastolik}
                            onChange={(e) => setDiastolik(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Suhu Tubuh (°C)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={suhu}
                            onChange={(e) => setSuhu(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Detak (BPM)
                          </label>
                          <input
                            type="number"
                            value={detakJantung}
                            onChange={(e) => setDetakJantung(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Diagnosa Dokter
                        </label>
                        <input
                          type="text"
                          required
                          value={diagnosa}
                          onChange={(e) => setDiagnosa(e.target.value)}
                          placeholder="Contoh: Hipertensi Primer Derajat 1"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Instruksi Pengobatan & Resep
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={resep}
                          onChange={(e) => setResep(e.target.value)}
                          placeholder="Dosis dan aturan konsumsi..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/30 transition-all uppercase tracking-wider text-sm"
                      >
                        Enkripsi & Simpan Rekam Medis
                      </button>
                    </form>
                  )}

                  {statusPenyimpanan && (
                    <div className="mt-4 p-3.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700">
                      Status: {statusPenyimpanan}
                    </div>
                  )}
                </div>
              </div>

              {/* INFORMASI STATUS PASIEN */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Profil Pasien Terpilih
                  </h3>
                  {selectedPatient && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Nama Lengkap</p>
                        <p className="font-extrabold text-slate-900">{selectedPatient.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Nomor Rekam Medis</p>
                        <p className="font-extrabold text-slate-900">{selectedPatient.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Ruang Rawat</p>
                        <p className="font-semibold text-slate-700">{selectedPatient.room}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Status Penugasan Admin</p>
                        <p className={`font-bold text-xs uppercase mt-0.5 ${hasAccess ? "text-emerald-700" : "text-red-700"}`}>
                          {hasAccess ? "Ditugaskan ke Anda" : "Bukan Pasien Anda"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {lastSavedRecord && (
                  <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                    <span className="text-xs font-black uppercase text-red-400">Bukti Kriptografis Tersimpan</span>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Ciphertext AES-256-GCM:</p>
                      <p className="font-mono text-xs break-all bg-slate-800 p-2 rounded-lg text-emerald-400 mt-1">
                        {lastSavedRecord.encryptedPayload}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">HMAC-SHA256 Digest:</p>
                      <p className="font-mono text-xs break-all bg-slate-800 p-2 rounded-lg text-amber-300 mt-1">
                        {lastSavedRecord.hmacDigest}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "riwayat" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">
                Status Pasien Bangsal Rawat Inap
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase font-black">
                      <th className="py-3 px-4">ID Pasien</th>
                      <th className="py-3 px-4">Nama Pasien</th>
                      <th className="py-3 px-4">Kamar</th>
                      <th className="py-3 px-4">Dokter Bertugas</th>
                      <th className="py-3 px-4">Hak Akses Anda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {patients.map((p: any) => {
                      const isMine = p.assignedDoctorId === session.id;
                      const doc = MOCK_DOCTORS.find((d: any) => d.id === p.assignedDoctorId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold">{p.id}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4">{p.room}</td>
                          <td className="py-3 px-4">{doc?.name || "Belum Ditugaskan"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 text-xs font-black rounded-full uppercase ${isMine ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                              {isMine ? "Diberikan Hak" : "Terkunci"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "grafik" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                Visualisasi Fluktuasi Tanda Vital Pasien
              </h3>
              <p className="text-xs text-slate-500 font-semibold mb-6">
                Tren Tekanan Darah Sistolik & Diastolik
              </p>
              <div className="h-64 flex items-end gap-6 border-b border-l border-slate-300 p-4">
                {records
                  .filter((r) => r.patientId === selectedPatientId)
                  .slice(-6)
                  .map((r, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1.5 h-48">
                        <div
                          style={{ height: `${(r.vitals.sistolik / 180) * 100}%` }}
                          className="w-5 bg-red-600 rounded-t-sm shadow"
                        />
                        <div
                          style={{ height: `${(r.vitals.diastolik / 180) * 100}%` }}
                          className="w-5 bg-slate-400 rounded-t-sm shadow"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE NAV BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center md:hidden z-40">
        <button onClick={() => setActiveTab("input")} className={`py-1 px-3 text-xs font-extrabold ${activeTab === "input" ? "text-red-600" : "text-slate-500"}`}>
          Input
        </button>
        <button onClick={() => setActiveTab("riwayat")} className={`py-1 px-3 text-xs font-extrabold ${activeTab === "riwayat" ? "text-red-600" : "text-slate-500"}`}>
          Pasien
        </button>
        <button onClick={() => setActiveTab("grafik")} className={`py-1 px-3 text-xs font-extrabold ${activeTab === "grafik" ? "text-red-600" : "text-slate-500"}`}>
          Grafik
        </button>
        <button onClick={onLogoutClick} className="py-1 px-3 text-xs font-extrabold text-red-600">
          Keluar
        </button>
      </nav>
    </div>
  );
}