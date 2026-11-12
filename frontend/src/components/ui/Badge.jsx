import React from 'react';

const BADGE_VARIANTS = {
  operator: 'bg-[#73d200]/20 text-gray-900 font-extrabold rounded px-2.5 py-0.5 text-[11px]',
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-full px-2.5 py-0.5 text-xs',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-full px-2.5 py-0.5 text-xs',
  danger: 'bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-full px-2.5 py-0.5 text-xs',
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200 font-semibold rounded px-2 py-0.5 text-[11px]',
  info: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-full px-2.5 py-0.5 text-xs',
};

export default function Badge({ children, variant = 'neutral', icon: Icon = null, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
