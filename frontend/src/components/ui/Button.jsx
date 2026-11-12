import React from 'react';

const VARIANTS = {
  primary:
    'bg-[#73d200] hover:bg-[#65b800] text-gray-900 font-bold shadow-sm focus:ring-2 focus:ring-[#73d200]/50',
  secondary:
    'bg-[#131b26] hover:bg-black text-white font-bold shadow-sm focus:ring-2 focus:ring-gray-700',
  outline:
    'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold focus:ring-2 focus:ring-gray-200',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm focus:ring-2 focus:ring-rose-500/50',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-700 font-semibold',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3.5 text-sm rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
        VARIANTS[variant] || VARIANTS.primary
      } ${SIZES[size] || SIZES.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
