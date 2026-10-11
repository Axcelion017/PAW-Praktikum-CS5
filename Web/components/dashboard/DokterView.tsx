"use client";

import React, { useState, useEffect } from "react";
import { encryptAES } from "@/lib/crypto/aes";
import { generateHMAC } from "@/lib/crypto/hmac";
import { UserSession } from "@/lib/auth/auth";
import StatCard from "@/components/ui/StatCard";

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

  // Input Klinis
  const [keluhan, setKeluhan] = useState<string>("");
  const [diagnosa, setDiagnosa] = useState<string>("");
  const [resep, setResep] = useState<string>("");
  const [sistolik, setSistolik] = useState<number>(120);
  const [diastolik, setDiastolik] = useState<number>(80);
  const [suhu, setSuhu] = useState<number>(36.5);
  const [detakJantung, setDetakJantung] = useState<number>(75);
  const [statusPenyimpanan, setStatusPenyimpanan] = useState<string>("");
  const [lastSavedRecord, setLastSavedRecord] = useState<any | null>(null);

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

  const selectedPatient = patients.find((p: any) => p.id === selectedPatientId) || patients[0];
  const hasAccess = selectedPatient?.assignedDoctorId === session.id;

  const handleSimpanRekamMedis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !hasAccess) return;

    setStatusPenyimpanan("Melakukan enkripsi AES-256-GCM dan kalkulasi HMAC...");
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
      setStatusPenyimpanan("Data rekam medis berhasil diamankan dan disimpan ke pangkalan data.");
      setKeluhan("");
      setDiagnosa("");
      setResep("");
    } catch {
      setStatusPenyimpanan("Gagal memproses enkripsi data rekam medis.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-28 md:pb-8">
      {/* 1. TOP BAR PUTIH BERSIFAT RESPONSIF */}
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
              Stasiun Tim Medis
            </p>
          </div>
        </div>

        {/* KARTU PROFIL DI KANAN ATAS */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 px-2.5 sm:p-2 sm:px-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-left">
            {/* FIX 1a: text-slate-400 → text-slate-600 untuk kontras */}
            <p className="text-[9px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              Dokter Aktif
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-none">
              {session.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold hidden md:inline">
                {session.specialization || "Spesialis Penyakit Dalam"}
              </span>
              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black rounded-full uppercase">
                SIP: {session.id}
              </span>
            </div>
          </div>

          {/* FIX 1b: text-red-600 → text-red-700 untuk kontras pada bg-red-50 */}
          <button
            onClick={onLogoutClick}
            className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs font-extrabold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm active:scale-95"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* 2. AREA KONTEN: DUAL LAYOUT (SIDEBAR DESKTOP/TABLET + CONTENT) */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* SIDEBAR TABLET & DESKTOP (DISEMBUNYIKAN DI PONSEL) */}
        <aside className="hidden md:flex w-60 lg:w-64 bg-white border-r border-slate-200 p-4 flex-col space-y-2 shrink-0">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider px-3 mb-2">
            Menu Navigasi
          </p>

          <button
            onClick={() => setActiveTab("input")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between ${
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
            className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between ${
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

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full">
          {/* TAB 1: FORMULIR INPUT */}
          {activeTab === "input" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* KOLOM KIRI: FORMULIR KLINIS */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-5 gap-2">
                    {/* FIX 2: h3 → h2 agar heading berurutan (h1 sudah ada di atas) */}
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Formulir Pemeriksaan & Diagnosa Klinis
                    </h2>
                    <span
                      className={`text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-full w-fit ${
                        hasAccess
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {hasAccess ? "Izin Input: Terverifikasi" : "Izin Input: Terkunci"}
                    </span>
                  </div>

                  {/* FIX 4: SELECT PASIEN — tambah htmlFor + id untuk aksesibilitas */}
                  <div className="mb-5">
                    <label htmlFor="pilih-pasien" className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                      Pilih Pasien Pemeriksaan:
                    </label>
                    <select
                      id="pilih-pasien"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
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

                  {!hasAccess ? (
                    <div className="p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                      <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                        Akses Dibatasi oleh Protokol Zero-Trust HIS
                      </p>
                      <p className="text-xs font-semibold leading-relaxed">
                        Anda tidak diizinkan memasukkan catatan atau membuka enkripsi pasien ini karena belum ditugaskan kepada Anda oleh Administrator Sistem.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSimpanRekamMedis} className="space-y-4 sm:space-y-5">
                      <div>
                        <label htmlFor="keluhan" className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Keluhan Utama Pasien
                        </label>
                        <textarea
                          id="keluhan"
                          required
                          rows={2}
                          value={keluhan}
                          onChange={(e) => setKeluhan(e.target.value)}
                          placeholder="Deskripsikan gejala klinis..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* FIX 3: GRID TANDA VITAL — tambah htmlFor + id ke setiap label/input */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                          <label htmlFor="sistolik" className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Sistolik (mmHg)
                          </label>
                          <input
                            id="sistolik"
                            type="number"
                            value={sistolik}
                            onChange={(e) => setSistolik(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label htmlFor="diastolik" className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Diastolik (mmHg)
                          </label>
                          <input
                            id="diastolik"
                            type="number"
                            value={diastolik}
                            onChange={(e) => setDiastolik(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label htmlFor="suhu" className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Suhu Tubuh (°C)
                          </label>
                          <input
                            id="suhu"
                            type="number"
                            step="0.1"
                            value={suhu}
                            onChange={(e) => setSuhu(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label htmlFor="detak-jantung" className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Detak (BPM)
                          </label>
                          <input
                            id="detak-jantung"
                            type="number"
                            value={detakJantung}
                            onChange={(e) => setDetakJantung(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="diagnosa" className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Diagnosa Dokter
                        </label>
                        <input
                          id="diagnosa"
                          type="text"
                          required
                          value={diagnosa}
                          onChange={(e) => setDiagnosa(e.target.value)}
                          placeholder="Contoh: Hipertensi Primer Derajat 1"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="resep" className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Instruksi Pengobatan & Resep
                        </label>
                        <textarea
                          id="resep"
                          required
                          rows={2}
                          value={resep}
                          onChange={(e) => setResep(e.target.value)}
                          placeholder="Dosis dan aturan konsumsi..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 sm:py-4 rounded-xl font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/30 transition-all uppercase tracking-wider text-xs sm:text-sm active:scale-[0.99]"
                      >
                        Enkripsi & Simpan Rekam Medis
                      </button>
                    </form>
                  )}

                  {statusPenyimpanan && (
                    <div className="mt-4 p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700">
                      {statusPenyimpanan}
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: STATISTIK & BUKTI KRIPTOGRAFI */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                    Profil Pasien Terpilih
                  </h2>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div>
                      {/* FIX 1c: text-slate-400 → text-slate-600 */}
                      <p className="text-[10px] text-slate-600 font-bold uppercase">Nama Lengkap</p>
                      <p className="font-extrabold text-slate-900">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">Nomor Rekam Medis</p>
                      <p className="font-extrabold text-slate-900">{selectedPatient.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">Ruang Rawat</p>
                      <p className="font-semibold text-slate-700">{selectedPatient.room}</p>
                    </div>
                  </div>
                </div>

                {lastSavedRecord && (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                    <span className="text-[11px] font-black uppercase text-red-400">Bukti Kriptografis Tersimpan</span>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Ciphertext AES-256-GCM:</p>
                      <p className="font-mono text-[10px] sm:text-xs break-all bg-slate-800 p-2 rounded-lg text-emerald-400 mt-1">
                        {lastSavedRecord.encryptedPayload}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">HMAC-SHA256 Digest:</p>
                      <p className="font-mono text-[10px] sm:text-xs break-all bg-slate-800 p-2 rounded-lg text-amber-300 mt-1">
                        {lastSavedRecord.hmacDigest}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TABEL PASIEN BANGSAL */}
          {activeTab === "riwayat" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Status Pasien Bangsal Rawat Inap
              </h2>
              <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] sm:text-xs text-slate-600 uppercase font-black">
                      <th className="py-3 px-3">ID Pasien</th>
                      <th className="py-3 px-3">Nama Pasien</th>
                      <th className="py-3 px-3">Kamar</th>
                      <th className="py-3 px-3">Dokter Bertugas</th>
                      <th className="py-3 px-3">Hak Akses Anda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {patients.map((p: any) => {
                      const isMine = p.assignedDoctorId === session.id;
                      const doc = MOCK_DOCTORS.find((d: any) => d.id === p.assignedDoctorId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold">{p.id}</td>
                          <td className="py-3 px-3 font-extrabold text-slate-900">{p.name}</td>
                          <td className="py-3 px-3">{p.room}</td>
                          <td className="py-3 px-3">{doc?.name || "Belum Ditugaskan"}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-black rounded-full uppercase ${isMine ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
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

          {/* TAB 3: GRAFIK VITAL */}
          {activeTab === "grafik" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Visualisasi Fluktuasi Tanda Vital Pasien
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Tren Tekanan Darah Sistolik & Diastolik
              </p>
              <div className="h-56 sm:h-64 flex items-end gap-3 sm:gap-6 border-b border-l border-slate-300 p-2 sm:p-4 overflow-x-auto">
                {records
                  .filter((r) => r.patientId === selectedPatientId)
                  .slice(-6)
                  .map((r, idx) => (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-40 sm:h-48">
                        <div
                          style={{ height: `${(r.vitals.sistolik / 180) * 100}%` }}
                          className="w-3.5 sm:w-5 bg-red-600 rounded-t-sm shadow"
                        />
                        <div
                          style={{ height: `${(r.vitals.diastolik / 180) * 100}%` }}
                          className="w-3.5 sm:w-5 bg-slate-400 rounded-t-sm shadow"
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-500">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. BOTTOM NAVIGATION KHUSUS PONSEL (DOKTER) */}
      <nav aria-label="Navigasi utama dokter" className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center md:hidden z-40 shadow-lg">
        <button
          onClick={() => setActiveTab("input")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-extrabold transition-all ${
            activeTab === "input" ? "text-red-600 font-black" : "text-slate-500"
          }`}
        >
          <span>Input Form</span>
        </button>
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-extrabold transition-all ${
            activeTab === "riwayat" ? "text-red-600 font-black" : "text-slate-500"
          }`}
        >
          <span>Pasien</span>
        </button>
        <button
          onClick={() => setActiveTab("grafik")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-extrabold transition-all ${
            activeTab === "grafik" ? "text-red-600 font-black" : "text-slate-500"
          }`}
        >
          <span>Grafik</span>
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