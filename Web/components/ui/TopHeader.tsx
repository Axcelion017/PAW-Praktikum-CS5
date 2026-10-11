import React from "react";
import { UserSession } from "@/lib/auth/auth";

export interface TopHeaderProps {
  title: string;
  subtitle: string;
  session: UserSession;
  roleLabel: string;
  onLogoutClick: () => void;
}

export function TopHeader({ title, subtitle, session, roleLabel, onLogoutClick }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-red-200">
          R
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none">
            {title}
          </h1>
          <p className="text-[9px] sm:text-[10px] text-red-600 font-extrabold uppercase tracking-wider mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 px-2.5 sm:p-2 sm:px-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-left">
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {roleLabel}
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-none">
            {session.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black rounded-full uppercase">
              ID: {session.id}
            </span>
          </div>
        </div>

        <button
          onClick={onLogoutClick}
          aria-label="Keluar dari sistem"
          className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm active:scale-95"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}

export default TopHeader;