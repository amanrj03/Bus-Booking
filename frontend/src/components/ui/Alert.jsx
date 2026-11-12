import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';

const ALERT_VARIANTS = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    iconColor: 'text-emerald-600',
    Icon: CheckCircleIcon,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    iconColor: 'text-amber-600',
    Icon: ExclamationTriangleIcon,
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    iconColor: 'text-rose-600',
    Icon: XCircleIcon,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    iconColor: 'text-blue-600',
    Icon: InformationCircleIcon,
  },
};

export default function Alert({ variant = 'info', title, children, className = '' }) {
  const style = ALERT_VARIANTS[variant] || ALERT_VARIANTS.info;
  const Icon = style.Icon;

  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 ${style.container} ${className}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
      <div className="text-xs flex-1">
        {title && <h4 className="font-bold text-sm mb-0.5">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
