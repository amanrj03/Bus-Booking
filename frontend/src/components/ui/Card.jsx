import React from 'react';

export default function Card({
  children,
  className = '',
  padding = 'p-5',
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${
        hoverable ? 'hover:shadow-md transition-shadow duration-200' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
