import React from "react";

export interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  unit?: string;
}

export function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  unit,
}: InputFieldProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="block text-[11px] font-bold text-slate-600 uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {unit && <span className="text-[10px] text-slate-400 font-semibold">{unit}</span>}
      </div>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 bg-red-50/50 text-red-900 focus:ring-red-400"
            : "border-slate-300 bg-white text-slate-900 focus:ring-red-500"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-[10px] font-bold text-red-600 mt-1 animate-fade-in" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;