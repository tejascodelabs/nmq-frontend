import React from 'react';

export default function InputField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  mandatory = false,
  error,
  disabled = false,
}) {
  return (
    <div className="mb-3.5 text-left">
      {label && (
        <label className="block mb-1 text-xs font-semibold text-[#2f211b]">
          {label} {mandatory && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 text-xs text-[#2f211b] bg-white border rounded-xl outline-none transition-all placeholder-[#a4adba] ${
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-[#ded5cb] focus:border-[#bf4c2a] focus:ring-2 focus:ring-[#bf4c2a]/20'
        } ${disabled ? 'bg-[#f8f5ef] text-gray-400 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}