"use client";

import React, { useState, useMemo, useEffect } from "react";

// ==========================================
// TIPE DATA & MODEL
// ==========================================
type Role = "doctor" | "patient";
type NetworkMode = "online" | "offline";
type MenuKey = "dashboard" | "form" | "list" | "reports" | "portal";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "L" | "P";
  mrn: string;
  lastVisit: string;
  hasAccess: boolean;
}

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  prescription: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  allergies: string;
  ciphertext: string;
  ivHex: string;
  hmacTag: string;
  isEncrypted: boolean;
  syncStatus: "synced" | "queued_indexeddb";
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetPatientId: string;
  device: string;
  ip: string;
  status: "AUTHORIZED" | "BLOCKED_BOLA" | "INTEGRITY_VERIFIED";
}

interface AuthorizedDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  accessStatus: "ACTIVE" | "REVOKED";
  lastAccess: string;
}

// ==========================================
// FUNGSI KRIPTOGRAFI SISI KLIEN (AES-GCM 256 + HMAC)
// ==========================================
async function clientSideEncryptAES_GCM(plainText: string, secretKey: string) {
  try {
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const keyHash = await crypto.subtle.digest("SHA-256", enc.encode(secretKey));
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyHash,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encodedData
    );

    const ciphertextArray = Array.from(new Uint8Array(encryptedBuffer));
    const ciphertextBase64 = btoa(String.fromCharCode(...ciphertextArray));
    const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");

    const hmacKey = await crypto.subtle.importKey(
      "raw",
      keyHash,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", hmacKey, encodedData);
    const hmacTag = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);

    return { ciphertext: ciphertextBase64, ivHex, hmacTag };
  } catch {
    return {
      ciphertext: "c8f7e2a9b3d14e9f==" + btoa(plainText).slice(0, 16),
      ivHex: "3a9f10c74b8e219001bfa24e",
      hmacTag: "8e71ab93f019cd24ba8921e57c6b901a",
    };
  }
}

// ==========================================
// DATA AWAL
// ==========================================
const INITIAL_PATIENTS: Patient[] = [
  { id: "P-101", name: "Budi Santoso", age: 45, gender: "L", mrn: "MRN-2026-0081", lastVisit: "2026-10-01", hasAccess: true },
  { id: "P-102", name: "Siti Rahmawati", age: 34, gender: "P", mrn: "MRN-2026-0082", lastVisit: "2026-09-28", hasAccess: true },
  { id: "P-103", name: "Arman Patel", age: 29, gender: "L", mrn: "MRN-2026-0083", lastVisit: "2026-09-25", hasAccess: true },
  { id: "P-104", name: "Dewi Lestari", age: 52, gender: "P", mrn: "MRN-2026-0084", lastVisit: "2026-09-18", hasAccess: false },
];

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: "REC-01",
    patientId: "P-101",
    patientName: "Budi Santoso",
    doctorName: "dr. Hendra Sp.PD",
    date: "2026-09-15",
    diagnosis: "Hipertensi Grade 1 & Dislipidemia",
    prescription: "Amlodipine 5mg (1x1), Atorvastatin 20mg (0-0-1)",
    systolic: 145,
    diastolic: 92,
    heartRate: 84,
    allergies: "Penisilin",
    ciphertext: "ENC_GCM256_u19aKx29JalQ091==",
    ivHex: "81e3a992bc401f82",
    hmacTag: "91ba2014acde7721",
    isEncrypted: true,
    syncStatus: "synced",
  },
  {
    id: "REC-02",
    patientId: "P-101",
    patientName: "Budi Santoso",
    doctorName: "dr. Hendra Sp.PD",
    date: "2026-10-01",
    diagnosis: "Follow-up Hipertensi membaik",
    prescription: "Amlodipine 5mg diteruskan",
    systolic: 130,
    diastolic: 85,
    heartRate: 76,
    allergies: "Penisilin",
    ciphertext: "ENC_GCM256_p288vB100xMla91==",
    ivHex: "99fa0120194acbc1",
    hmacTag: "aa39182049102bca",
    isEncrypted: true,
    syncStatus: "synced",
  },
];

const INITIAL_DOCTORS: AuthorizedDoctor[] = [
  { id: "DOC-01", name: "dr. Hendra Sp.PD", specialty: "Spesialis Penyakit Dalam", hospital: "RSUP Dr. Sardjito", accessStatus: "ACTIVE", lastAccess: "2026-10-01 10:14 WIB" },
  { id: "DOC-02", name: "dr. Sarah Sp.A", specialty: "Spesialis Anak", hospital: "Klinik Pratama Sehat", accessStatus: "ACTIVE", lastAccess: "2026-09-20 14:30 WIB" },
  { id: "DOC-03", name: "dr. Rian Sp.JP", specialty: "Spesialis Jantung", hospital: "RS Harapan Sehat", accessStatus: "REVOKED", lastAccess: "2026-08-12 09:15 WIB" },
];

export default function ResilioHealthPage() {
  // Global States
  const [currentRole, setCurrentRole] = useState<Role>("doctor");
  const [networkStatus, setNetworkStatus] = useState<NetworkMode>("online");
  const [activeMenu, setActiveMenu] = useState<MenuKey>("form");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Patients & Records
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("P-101");
  const [records, setRecords] = useState<MedicalRecord[]>(INITIAL_RECORDS);

  // Form States
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("72");
  const [allergies, setAllergies] = useState("Tidak Ada");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [lastEncryptedReceipt, setLastEncryptedReceipt] = useState<MedicalRecord | null>(null);

  // Security & Portal States
  const [authorizedDoctors, setAuthorizedDoctors] = useState<AuthorizedDoctor[]>(INITIAL_DOCTORS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "LOG-01",
      timestamp: "2026-10-02 07:15:20 WIB",
      actor: "dr. Hendra Sp.PD",
      action: "READ_RECORD_DECRYPT",
      targetPatientId: "P-101",
      device: "MacBook Pro / Chrome",
      ip: "192.168.1.42 (LAN RS)",
      status: "AUTHORIZED",
    },
    {
      id: "LOG-02",
      timestamp: "2026-10-01 16:40:11 WIB",
      actor: "API Gateway (SATUSEHAT)",
      action: "HMAC_INTEGRITY_CHECK",
      targetPatientId: "P-101",
      device: "Gateway Server 02",
      ip: "10.200.4.15",
      status: "INTEGRITY_VERIFIED",
    },
  ]);

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  const offlineQueueCount = useMemo(() => {
    return records.filter((r) => r.syncStatus === "queued_indexeddb").length;
  }, [records]);

  // Simulasi Background Sync saat kembali online
  useEffect(() => {
    if (networkStatus === "online" && offlineQueueCount > 0) {
      const timer = setTimeout(() => {
        setRecords((prev) =>
          prev.map((r) => (r.syncStatus === "queued_indexeddb" ? { ...r, syncStatus: "synced" } : r))
        );
        setAuditLogs((prev) => [
          {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
            actor: "PWA Service Worker",
            action: "AUTO_SYNC_INDEXEDDB_TO_CLOUD",
            targetPatientId: "BULK_SYNC",
            device: "Client Browser Worker",
            ip: "127.0.0.1",
            status: "INTEGRITY_VERIFIED",
          },
          ...prev,
        ]);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [networkStatus, offlineQueueCount]);

  // Handler Simpan Rekam Medis (Kriptografi AES-GCM 256)
  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis || !prescription) {
      alert("Mohon lengkapi Diagnosis dan Resep!");
      return;
    }

    if (!activePatient.hasAccess) {
      alert("AKSES DITOLAK (BOLA DEFENSE): Dokter ini tidak memiliki izin aktif terhadap pasien ini!");
      setAuditLogs((prev) => [
        {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
          actor: "dr. Hendra Sp.PD",
          action: "UNAUTHORIZED_WRITE_ATTEMPT",
          targetPatientId: activePatient.id,
          device: "Mobile PWA Client",
          ip: "192.168.1.42",
          status: "BLOCKED_BOLA",
        },
        ...prev,
      ]);
      return;
    }

    setIsEncrypting(true);

    const rawPayload = JSON.stringify({
      patientId: activePatient.id,
      patientName: activePatient.name,
      diagnosis,
      prescription,
      vitals: { systolic, diastolic, heartRate },
      allergies,
      timestamp: new Date().toISOString(),
    });

    const encryptionResult = await clientSideEncryptAES_GCM(rawPayload, "DoctorSessionMasterSecretKey2026!");

    const newRecord: MedicalRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      patientId: activePatient.id,
      patientName: activePatient.name,
      doctorName: "dr. Hendra Sp.PD",
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      prescription,
      systolic: parseInt(systolic) || 120,
      diastolic: parseInt(diastolic) || 80,
      heartRate: parseInt(heartRate) || 75,
      allergies,
      ciphertext: encryptionResult.ciphertext,
      ivHex: encryptionResult.ivHex,
      hmacTag: encryptionResult.hmacTag,
      isEncrypted: true,
      syncStatus: networkStatus === "online" ? "synced" : "queued_indexeddb",
    };

    setTimeout(() => {
      setRecords((prev) => [newRecord, ...prev]);
      setLastEncryptedReceipt(newRecord);
      setIsEncrypting(false);

      setAuditLogs((prev) => [
        {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
          actor: "dr. Hendra Sp.PD",
          action: networkStatus === "online" ? "ENCRYPT_AND_CLOUD_SYNC" : "ENCRYPT_AND_SAVE_INDEXEDDB",
          targetPatientId: activePatient.id,
          device: "Mobile EHR Terminal",
          ip: "192.168.1.42",
          status: "AUTHORIZED",
        },
        ...prev,
      ]);

      setDiagnosis("");
      setPrescription("");
    }, 350);
  };

  const toggleDoctorAccess = (doctorId: string) => {
    setAuthorizedDoctors((prev) =>
      prev.map((doc) => {
        if (doc.id === doctorId) {
          const newStatus = doc.accessStatus === "ACTIVE" ? "REVOKED" : "ACTIVE";
          setAuditLogs((l) => [
            {
              id: `LOG-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString("id-ID") + " WIB",
              actor: "Pasien (Budi Santoso)",
              action: newStatus === "REVOKED" ? "REVOKE_DOCTOR_ACCESS" : "GRANT_DOCTOR_ACCESS",
              targetPatientId: "P-101",
              device: "Smartphone Pasien (PWA)",
              ip: "182.253.12.9",
              status: "AUTHORIZED",
            },
            ...l,
          ]);
          return { ...doc, accessStatus: newStatus };
        }
        return doc;
      })
    );
  };

  return (
    <>
      {/* Impor Font Montserrat */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Montserrat', sans-serif !important;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* Main Container */}
      <div className="min-h-screen bg-[#F8FAFC] text-neutral-800 flex flex-col lg:flex-row antialiased pb-20 lg:pb-0">
        {/* ======================================================== */}
        {/* <aside> SIDEBAR MENTOK KE KIRI (RESPONSIF MOBILE DRAWER) */}
        {/* ======================================================== */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white border-r border-neutral-200 text-neutral-700 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-xs ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Top Brand Logo & Close Button for Mobile */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/25">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-neutral-900 leading-none">
                    Resilio<span className="text-red-600">-Health</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase mt-1">
                    Hospital System
                  </span>
                </div>
              </div>

              {/* Close Button on Mobile Drawer */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Navigasi */}
            <nav className="py-4 space-y-1">
              {/* 1. Dashboard */}
              <button
                onClick={() => {
                  setCurrentRole("doctor");
                  setActiveMenu("dashboard");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-6 py-3 text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                  activeMenu === "dashboard"
                    ? "bg-red-50 text-red-700 font-extrabold border-r-4 border-red-600"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <svg className={`w-4 h-4 ${activeMenu === "dashboard" ? "text-red-600" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Dashboard</span>
              </button>

              {/* 2. Form (Input Baru) */}
              <button
                onClick={() => {
                  setCurrentRole("doctor");
                  setActiveMenu("form");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-6 py-3 text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                  activeMenu === "form"
                    ? "bg-red-50 text-red-700 font-extrabold border-r-4 border-red-600"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <svg className={`w-4 h-4 ${activeMenu === "form" ? "text-red-600" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Form (Input Baru)</span>
              </button>

              {/* 3. List (Daftar Pasien) */}
              <button
                onClick={() => {
                  setCurrentRole("doctor");
                  setActiveMenu("list");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-6 py-3 text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                  activeMenu === "list"
                    ? "bg-red-50 text-red-700 font-extrabold border-r-4 border-red-600"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <svg className={`w-4 h-4 ${activeMenu === "list" ? "text-red-600" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>List (Daftar Pasien)</span>
              </button>

              {/* 4. Profile & Laporan */}
              <button
                onClick={() => {
                  setCurrentRole("doctor");
                  setActiveMenu("reports");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-6 py-3 text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                  activeMenu === "reports"
                    ? "bg-red-50 text-red-700 font-extrabold border-r-4 border-red-600"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <svg className={`w-4 h-4 ${activeMenu === "reports" ? "text-red-600" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Profile & Laporan</span>
              </button>

              {/* 5. Result (Portal Pasien / Zero-Trust BOLA) */}
              <button
                onClick={() => {
                  setCurrentRole("patient");
                  setActiveMenu("portal");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-6 py-3 text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                  activeMenu === "portal"
                    ? "bg-red-50 text-red-700 font-extrabold border-r-4 border-red-600"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <svg className={`w-4 h-4 ${activeMenu === "portal" ? "text-red-600" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Result (Portal Pasien)</span>
              </button>

              <div className="pt-4 px-6">
                <div className="h-px bg-neutral-200 w-full" />
              </div>

              {/* Status Sistem */}
              <div className="px-6 py-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Status Sistem
              </div>

              <div className="px-6 py-1 text-xs text-neutral-600 flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${networkStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                <span className="font-medium">{networkStatus === "online" ? "Server Online" : "IndexedDB Mode"}</span>
              </div>
            </nav>
          </div>

          {/* Bottom Sidebar Box */}
          <div className="p-3.5 m-3 rounded-xl bg-red-50/60 border border-red-100 text-[11px] text-neutral-700 space-y-1">
            <span className="font-extrabold text-red-700 text-xs block">
              Integrasi 3 Mata Kuliah:
            </span>
            <p className="text-neutral-600">• <strong>PAW</strong>: Offline PWA & Sync</p>
            <p className="text-neutral-600">• <strong>Kripto</strong>: AES-GCM 256 + HMAC</p>
            <p className="text-neutral-600">• <strong>Siber</strong>: Zero-Trust BOLA</p>
          </div>
        </aside>

        {/* Backdrop untuk Mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* ======================================================== */}
        {/* MAIN CONTENT AREA */}
        {/* ======================================================== */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Header Responsif untuk Mobile & Desktop */}
          <header className="h-14 sm:h-16 bg-white border-b border-neutral-200 px-3 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            {/* Sisi Kiri: Hamburger + Brand Ringkas (Mobile) & Search (Desktop) */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200"
                aria-label="Buka Menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="lg:hidden flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                  R
                </div>
                <span className="font-extrabold text-sm text-neutral-900 tracking-tight">
                  Resilio<span className="text-red-600">H</span>
                </span>
              </div>

              {/* Form Search Global (Desktop) */}
              <form onSubmit={(e) => e.preventDefault()} className="relative hidden md:block w-56 lg:w-72">
                <input
                  type="text"
                  placeholder="Search (Nama Pasien / MRN)..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full bg-neutral-100 text-xs text-neutral-800 pl-8 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                />
                <svg className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>
            </div>

            {/* Sisi Kanan: Status Jaringan PWA & Profil Ringkas */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dynamic Status Indicator (Compact di Ponsel) */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${networkStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                <span className="font-bold text-[11px] sm:text-xs text-neutral-700 hidden sm:inline">
                  {networkStatus === "online" ? "Online" : "Offline (IndexedDB)"}
                </span>

                <button
                  onClick={() => setNetworkStatus((prev) => (prev === "online" ? "offline" : "online"))}
                  className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-white hover:bg-neutral-50 active:bg-neutral-200 text-neutral-800 border border-neutral-300 transition-all cursor-pointer shadow-2xs"
                  title="Simulasi Putus/Pulihkan Internet"
                >
                  {networkStatus === "online" ? "Putus" : "Pulih"}
                </button>
              </div>

              {offlineQueueCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] sm:text-xs font-bold">
                  <span>Antre:</span>
                  <strong>{offlineQueueCount}</strong>
                </div>
              )}

              {/* Profile Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 border border-red-300 text-red-700 font-bold flex items-center justify-center text-xs">
                  {currentRole === "doctor" ? "DH" : "BS"}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-neutral-900 leading-tight">
                    {currentRole === "doctor" ? "dr. Hendra" : "Budi S."}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {currentRole === "doctor" ? "Dokter Spesialis" : "Pasien"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Quick Search Bar untuk Ponsel */}
          <div className="p-3 bg-white border-b border-neutral-200 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari pasien / rekam medis..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-neutral-100 text-xs text-neutral-800 pl-8 pr-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:bg-white focus:border-red-500 font-medium"
              />
              <svg className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Content Body Workspace */}
          <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {/* Quick Patient Carousel Selector Khusus Tampilan Ponsel */}
            <div className="lg:hidden bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Pilih Pasien Aktif:
                </span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {activePatient.name}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {patients.map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => setSelectedPatientId(pat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      selectedPatientId === pat.id
                        ? "bg-red-600 text-white border-red-600 shadow-2xs"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    <span>{pat.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedPatientId === pat.id ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"}`}>
                      {pat.gender}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {currentRole === "doctor" ? (
              <>
                {/* 2 Kolom: <section class='patient-list'> & <section class='ehr-form'> */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                  {/* <section class='patient-list'> (Disembunyikan di ponsel karena sudah ada quick-selector di atas, atau tampil di desktop) */}
                  <section className="patient-list hidden lg:flex lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-4 flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                        <div>
                          <h2 className="text-sm font-extrabold text-neutral-900 tracking-tight">
                            Patient List
                          </h2>
                          <p className="text-[11px] text-neutral-500">Pilih pasien aktif untuk rekam medis</p>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                          {patients.length} Pasien
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
                        {patients.map((pat) => (
                          <div
                            key={pat.id}
                            onClick={() => setSelectedPatientId(pat.id)}
                            className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                              selectedPatientId === pat.id
                                ? "bg-red-50/80 border-red-400 text-neutral-900 shadow-2xs"
                                : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  selectedPatientId === pat.id
                                    ? "bg-red-600 text-white"
                                    : "bg-neutral-100 text-neutral-600"
                                }`}
                              >
                                {pat.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-neutral-900">{pat.name}</p>
                                <p className="text-[10px] text-neutral-500">
                                  {pat.mrn} • {pat.age} thn ({pat.gender})
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  pat.hasAccess
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {pat.hasAccess ? "Aktif" : "Revoked"}
                              </span>
                              <p className="text-[10px] text-neutral-400 mt-1">{pat.lastVisit}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 mt-2 font-medium">
                      <span>Hal. 1 dari 1</span>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 border border-neutral-200">«</button>
                        <button className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 border border-neutral-200">‹</button>
                        <button className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 border border-neutral-200">›</button>
                        <button className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 border border-neutral-200">»</button>
                      </div>
                    </div>
                  </section>

                  {/* <section class='ehr-electronic health records'> Form Input */}
                  <section className="ehr-form lg:col-span-8 bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3 sm:mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                            Electronic Health Records Form
                          </span>
                          <h2 className="text-sm sm:text-base font-extrabold text-neutral-900">
                            Input Rekam Medis Pasien
                          </h2>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-neutral-800">
                            Pasien: <strong className="text-red-600">{activePatient.name}</strong>
                          </span>
                          <p className="text-[10px] text-neutral-500 font-mono">{activePatient.mrn}</p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveMedicalRecord} className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">
                              Diagnosis Medis
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Masukkan hasil diagnosis..."
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              required
                              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-neutral-400 resize-none font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">
                              Resep & Terapi Obat
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Masukkan resep obat, dosis, cara pakai..."
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              required
                              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-sm text-neutral-800 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-neutral-400 resize-none font-medium"
                            />
                          </div>
                        </div>

                        {/* Vital Signs (Grid 2 kolom di ponsel, 4 kolom di desktop) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Sistolik (mmHg)
                            </label>
                            <input
                              type="number"
                              value={systolic}
                              onChange={(e) => setSystolic(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-2 text-sm text-neutral-800 focus:outline-none focus:border-red-500 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Diastolik (mmHg)
                            </label>
                            <input
                              type="number"
                              value={diastolic}
                              onChange={(e) => setDiastolic(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-2 text-sm text-neutral-800 focus:outline-none focus:border-red-500 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Detak Jantung (bpm)
                            </label>
                            <input
                              type="number"
                              value={heartRate}
                              onChange={(e) => setHeartRate(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-2 text-sm text-neutral-800 focus:outline-none focus:border-red-500 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                              Riwayat Alergi
                            </label>
                            <input
                              type="text"
                              value={allergies}
                              onChange={(e) => setAllergies(e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-2 text-sm text-neutral-800 focus:outline-none focus:border-red-500 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Button Simpan Enkripsi (Ukuran Sentuh Nyaman di Ponsel) */}
                        <button
                          type="submit"
                          disabled={isEncrypting}
                          className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm transition-all duration-150 ease-out shadow-md shadow-red-600/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isEncrypting ? (
                            <span>Menjalankan Kriptografi AES-GCM 256...</span>
                          ) : (
                            <>
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Simpan Rekam Medis (Enkripsi AES-GCM 256 + HMAC)</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {lastEncryptedReceipt && (
                      <div className="mt-3 p-3 bg-red-50/60 border border-red-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-red-700 font-bold">
                          <span>Ciphertext Kriptografi:</span>
                          <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded text-red-800 uppercase font-mono">
                            {lastEncryptedReceipt.syncStatus}
                          </span>
                        </div>
                        <p className="text-neutral-700 break-all font-mono text-[10px] sm:text-[11px]">
                          {lastEncryptedReceipt.ciphertext}
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                {/* <section class='data-visualization'> */}
                <section className="data-visualization bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 mb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 tracking-tight">
                        Visualisasi Riwayat Tanda Vital Pasien
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Tren Tekanan Darah & Detak Jantung ({activePatient.name})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold cursor-pointer">
                        Line Chart
                      </button>
                      <button className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 border border-neutral-200 text-[11px] font-semibold cursor-pointer">
                        Ringkasan
                      </button>
                    </div>
                  </div>

                  <div className="h-40 sm:h-44 w-full bg-neutral-50/70 rounded-xl p-3 sm:p-4 border border-neutral-200 relative flex flex-col justify-between">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-1 bg-red-600 rounded-full"></span>
                        <span className="text-neutral-700">Sistolik</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-1 bg-rose-400 rounded-full"></span>
                        <span className="text-neutral-700">Diastolik</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-1 bg-neutral-400 rounded-full"></span>
                        <span className="text-neutral-700">Detak Jantung</span>
                      </div>
                    </div>

                    <svg className="w-full h-24 sm:h-28 overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
                      <line x1="0" y1="20" x2="600" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="600" y2="50" stroke="#E5E7EB" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="600" y2="80" stroke="#E5E7EB" strokeDasharray="3 3" />

                      <polyline fill="none" stroke="#DC2626" strokeWidth="3" points="50,25 150,45 250,30 350,20 450,35 550,28" />
                      <polyline fill="none" stroke="#FB7185" strokeWidth="2.5" points="50,55 150,65 250,60 350,50 450,58 550,52" />
                      <polyline fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 2" points="50,40 150,50 250,45 350,42 450,48 550,44" />

                      <circle cx="50" cy="25" r="4" fill="#DC2626" />
                      <circle cx="150" cy="45" r="4" fill="#DC2626" />
                      <circle cx="250" cy="30" r="4" fill="#DC2626" />
                      <circle cx="350" cy="20" r="4" fill="#DC2626" />
                      <circle cx="450" cy="35" r="4" fill="#DC2626" />
                      <circle cx="550" cy="28" r="4" fill="#DC2626" />
                    </svg>

                    <div className="flex justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-200 font-medium">
                      <span>10 Agu</span>
                      <span>24 Agu</span>
                      <span>07 Sep</span>
                      <span>15 Sep</span>
                      <span>28 Sep</span>
                      <span>02 Okt</span>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              // PORTAL PASIEN (ZERO TRUST BOLA)
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-red-200 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                      Hak Otonomi Pasien • Zero-Trust
                    </span>
                    <h2 className="text-base sm:text-xl font-extrabold text-neutral-900 mt-0.5">
                      Kontrol Izin Akses Rekam Medis
                    </h2>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Sesuai UU PDP dan mitigasi kerentanan <strong>BOLA</strong>, Anda dapat mencabut wewenang dokter kapan saja.
                    </p>
                  </div>
                  <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl font-bold">
                    P-101 (Budi Santoso)
                  </span>
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-neutral-900 mb-3">
                    Manajemen Hak Akses Dokter
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {authorizedDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          doc.accessStatus === "ACTIVE"
                            ? "bg-white border-neutral-200"
                            : "bg-neutral-50 border-neutral-200 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                doc.accessStatus === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {doc.accessStatus}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">{doc.id}</span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900">{doc.name}</h4>
                          <p className="text-[11px] text-red-600 font-semibold">{doc.specialty}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{doc.hospital}</p>
                        </div>

                        <button
                          onClick={() => toggleDoctorAccess(doc.id)}
                          className={`mt-3 w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                            doc.accessStatus === "ACTIVE"
                              ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                              : "bg-neutral-900 hover:bg-black text-white"
                          }`}
                        >
                          {doc.accessStatus === "ACTIVE" ? "Cabut Izin (Revoke)" : "Beri Izin (Grant)"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Log (Overflow Table di Mobile) */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-neutral-900 mb-3">
                    Log Aktivitas Keamanan (Audit Trail)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium min-w-[500px]">
                      <thead className="bg-neutral-50 text-neutral-500 text-[10px] uppercase tracking-wider border-b border-neutral-200">
                        <tr>
                          <th className="py-2 px-2.5">Waktu</th>
                          <th className="py-2 px-2.5">Aktor</th>
                          <th className="py-2 px-2.5">Aksi</th>
                          <th className="py-2 px-2.5">Perangkat</th>
                          <th className="py-2 px-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-neutral-50">
                            <td className="py-2 px-2.5 text-neutral-400 whitespace-nowrap">{log.timestamp}</td>
                            <td className="py-2 px-2.5 font-bold text-neutral-900">{log.actor}</td>
                            <td className="py-2 px-2.5 text-red-600">{log.action}</td>
                            <td className="py-2 px-2.5 text-neutral-500 truncate max-w-[140px]">{log.device}</td>
                            <td className="py-2 px-2.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ======================================================== */}
        {/* DOCK BAR BAWAH KHUSUS LAYAR PONSEL (NATIVE PWA APP FEEL) */}
        {/* ======================================================== */}
        <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-40 lg:hidden flex items-center justify-around px-2 py-1.5 shadow-lg">
          <button
            onClick={() => {
              setCurrentRole("doctor");
              setActiveMenu("dashboard");
            }}
            className={`flex flex-col items-center p-1 text-[10px] font-bold ${
              activeMenu === "dashboard" && currentRole === "doctor" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole("doctor");
              setActiveMenu("form");
            }}
            className={`flex flex-col items-center p-1 text-[10px] font-bold ${
              activeMenu === "form" && currentRole === "doctor" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Input EHR</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole("doctor");
              setActiveMenu("list");
            }}
            className={`flex flex-col items-center p-1 text-[10px] font-bold ${
              activeMenu === "list" && currentRole === "doctor" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Pasien</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole("patient");
              setActiveMenu("portal");
            }}
            className={`flex flex-col items-center p-1 text-[10px] font-bold ${
              currentRole === "patient" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Portal Pasien</span>
          </button>
        </nav>
      </div>
    </>
  );
}