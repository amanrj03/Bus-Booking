import React from 'react';

export default function Input({
  label,
  error,
  icon: Icon = null,
  className = '',
  containerClassName = '',
  id,
  required = false,
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      <div
        className={`border rounded-lg px-3 py-2 bg-gray-50 flex items-center gap-2.5 transition-colors focus-within:bg-white ${
          error
            ? 'border-rose-400 focus-within:border-rose-500'
            : 'border-gray-300 focus-within:border-[#73d200]'
        }`}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={inputId}
              className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5 select-none"
            >
              {label} {required && <span className="text-rose-500">*</span>}
            </label>
          )}
          <input
            id={inputId}
            className={`w-full bg-transparent font-medium text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:text-gray-500 ${className}`}
            {...props}
          />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600 font-medium mt-1 pl-1">{error}</p>}
    </div>
  );
}
