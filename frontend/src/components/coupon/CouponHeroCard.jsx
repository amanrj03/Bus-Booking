import React, { useState, useEffect } from 'react';
import {
  DocumentDuplicateIcon,
  CheckIcon,
  XMarkIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { fetchActiveCoupons } from '../../services/coupon.service';

export default function CouponHeroCard() {
  const [coupon, setCoupon] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed coupon popup in this session
    const isDismissed = sessionStorage.getItem('gobus_hide_hero_coupon') === 'true';
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    let isMounted = true;
    fetchActiveCoupons()
      .then((coupons) => {
        if (!isMounted || !coupons || coupons.length === 0) return;
        // Find HOPON9 or the primary high-discount coupon
        const featured =
          coupons.find((c) => c.code === 'HOPON9') ||
          coupons.find((c) => c.discountType === 'PERCENTAGE') ||
          coupons[0];
        setCoupon(featured);
      })
      .catch(() => {
        // Fallback default coupon if offline
        setCoupon({
          code: 'HOPON9',
          description: 'Flat 15% off your festive travels',
          discountType: 'PERCENTAGE',
          discountValue: 15,
          expiryDate: '2026-11-30T23:59:59.000Z',
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('gobus_hide_hero_coupon', 'true');
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!coupon?.code) return;
    navigator.clipboard?.writeText(coupon.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (dismissed || !coupon) {
    return null;
  }

  const formatExpiry = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return '30 NOVEMBER 2026';
    }
  };

  return (
    <div
      role="region"
      aria-label="Promotional offer"
      className="bg-white/95 backdrop-blur-md text-gray-900 rounded-xl shadow-2xl p-5 border border-white/60 max-w-sm w-full transition-all animate-fade-in relative z-20"
    >
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Hide coupon offer"
        title="Hide offer"
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors cursor-pointer"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      {/* Header Validity */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
        <TagIcon className="w-3.5 h-3.5 text-[#65b800]" />
        <span>VALID UNTIL {formatExpiry(coupon.expiryDate)}</span>
      </div>

      {/* Title */}
      <h3 className="font-extrabold text-gray-900 text-base leading-snug mb-1 pr-6">
        {coupon.code === 'HOPON9'
          ? 'Flat 15% off your festive travels'
          : coupon.description || `Special ${coupon.discountValue}% Off`}
      </h3>

      {/* Subtitle */}
      <p className="text-xs text-gray-600 mb-3.5 leading-relaxed">
        Save on your trips back home or explore someplace new. Book now before seats fill up.
      </p>

      {/* Coupon Code Pill with Copy Action */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-800 transition-colors cursor-pointer group"
          title="Click to copy coupon code"
        >
          <span>Code</span>
          <span className="font-black text-gray-950 tracking-wider text-sm">
            {coupon.code}
          </span>
          {copied ? (
            <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-bold pl-1">
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </span>
          ) : (
            <DocumentDuplicateIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-800 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
