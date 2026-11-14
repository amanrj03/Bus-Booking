import React, { useState, useEffect, useCallback } from 'react';
import {
  TagIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  toggleAdminCoupon,
  deleteAdminCoupon,
} from '../../services/coupon.service';
import { Button, Card, Badge, Input, Select, Modal, Alert } from '../ui';

const INITIAL_FORM = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 15,
  maxDiscount: 200,
  minBookingAmount: 499,
  usageLimit: 1000,
  perUserLimit: 1,
  startDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0],
  isActive: true,
};

export default function AdminCouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminCoupons({
        search,
        status: statusFilter,
        limit: 50,
      });
      setCoupons(data.coupons || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      setError(err.message || 'Failed to load promotional coupons.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm(INITIAL_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount || '',
      minBookingAmount: c.minBookingAmount,
      usageLimit: c.usageLimit || '',
      perUserLimit: c.perUserLimit || 1,
      startDate: c.startDate ? c.startDate.split('T')[0] : '',
      expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : '',
      isActive: c.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }

    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    if (form.discountType === 'PERCENTAGE' && Number(form.discountValue) > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (!form.expiryDate) {
      setFormError('Expiry date is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon.id, form);
        setSuccess(`Coupon '${editingCoupon.code}' updated successfully.`);
      } else {
        await createAdminCoupon(form);
        setSuccess(`Coupon '${form.code.toUpperCase()}' created successfully.`);
      }
      setModalOpen(false);
      loadCoupons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c) => {
    try {
      await toggleAdminCoupon(c.id);
      loadCoupons();
    } catch (err) {
      setError(err.message || 'Failed to toggle coupon status.');
    }
  };

  const handleDeletePrompt = (c) => {
    setCouponToDelete(c);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminCoupon(couponToDelete.id);
      setSuccess(`Coupon '${couponToDelete.code}' deleted.`);
      setDeleteModalOpen(false);
      setCouponToDelete(null);
      loadCoupons();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete coupon.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-[#73d200]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Promotional Coupon Management
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure, activate, monitor, and manage network-wide passenger discount codes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCoupons}
            loading={loading}
            icon={ArrowPathIcon}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={PlusIcon}
            className="bg-[#73d200] hover:bg-[#65b800] text-gray-950 font-bold"
          >
            Create New Coupon
          </Button>
        </div>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="p-4" className="border-l-4 border-l-[#73d200] space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
            Total Coupons
          </span>
          <div className="text-2xl font-black text-gray-900">
            {metrics.totalCoupons}
          </div>
          <p className="text-[11px] text-gray-400">Configured promotional offers</p>
        </Card>

        <Card padding="p-4" className="border-l-4 border-l-emerald-500 space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
            Active Offers
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {metrics.activeCoupons}
          </div>
          <p className="text-[11px] text-gray-400">Available to customers now</p>
        </Card>

        <Card padding="p-4" className="border-l-4 border-l-blue-500 space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
            Total Redemptions
          </span>
          <div className="text-2xl font-black text-blue-600">
            {Number(metrics.totalRedemptions).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-gray-400">Successful checkout applications</p>
        </Card>

        <Card padding="p-4" className="border-l-4 border-l-amber-500 space-y-1">
          <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
            Total Savings Given
          </span>
          <div className="text-2xl font-black text-gray-900">
            ₹{Number(metrics.totalDiscountGiven).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-gray-400">Customer savings absorbed</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="p-4" className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by coupon code (e.g. HOPON9) or description..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#73d200]"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#73d200]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
            <option value="EXPIRED">Expired Only</option>
          </select>
        </div>
      </Card>

      {/* Coupons Table */}
      <Card padding="p-0" className="overflow-hidden shadow-xs border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Booking</th>
                <th className="py-3 px-4">Redemptions / Limit</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No promotional coupons found matching your criteria.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-black">
                      <span className="px-2.5 py-1 rounded bg-[#73d200]/20 text-gray-950 font-mono text-xs border border-[#73d200]/40">
                        {c.code}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-xs truncate" title={c.description}>
                      <span className="font-semibold text-gray-800">{c.description}</span>
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {c.discountType === 'PERCENTAGE' ? (
                        <span>
                          {c.discountValue}%{' '}
                          {c.maxDiscount ? (
                            <span className="text-gray-500 text-[11px] font-normal">
                              (Max ₹{c.maxDiscount})
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span>₹{c.discountValue} Flat</span>
                      )}
                    </td>

                    {/* Min Booking */}
                    <td className="py-3.5 px-4 font-semibold text-gray-700">
                      ₹{c.minBookingAmount}
                    </td>

                    {/* Redemptions / Limit */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-bold text-gray-900">
                          {c.usedCount}
                        </span>
                        <span className="text-gray-400">
                          {' '}/ {c.usageLimit !== null ? c.usageLimit : '∞'}
                        </span>
                        {c.usageLimit && (
                          <div className="w-20 bg-gray-200 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-[#73d200] h-full"
                              style={{
                                width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Validity */}
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      <div>
                        Until{' '}
                        <strong className="text-gray-900">
                          {new Date(c.expiryDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <ClockIcon className="w-3 h-3" /> Expired
                        </span>
                      ) : c.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircleIcon className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          <XCircleIcon className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggle(c)}
                          title={c.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                          className={`p-1.5 rounded hover:bg-gray-200 text-xs font-semibold cursor-pointer ${
                            c.isActive ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {c.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Coupon"
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePrompt(c)}
                          title="Delete Coupon"
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
        >
          <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
            {formError && <Alert type="danger">{formError}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Coupon Code"
                required
                placeholder="e.g. HOPON9, FESTIVE20"
                value={form.code}
                disabled={Boolean(editingCoupon)}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              <Input
                label="Campaign Description"
                required
                placeholder="e.g. Flat 15% off festive travel"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <Input
                label={form.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                type="number"
                min={1}
                max={form.discountType === 'PERCENTAGE' ? 100 : 10000}
                required
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />

              {form.discountType === 'PERCENTAGE' ? (
                <Input
                  label="Max Discount Cap (₹)"
                  type="number"
                  placeholder="e.g. 200 (optional)"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                />
              ) : (
                <div />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Min Booking Amount (₹)"
                type="number"
                min={0}
                value={form.minBookingAmount}
                onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
              />
              <Input
                label="Total Usage Limit"
                type="number"
                placeholder="e.g. 1000 (optional)"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              />
              <Input
                label="Per-User Limit"
                type="number"
                min={1}
                value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                label="Expiry Date"
                type="date"
                required
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="accent-[#73d200] w-4 h-4 rounded cursor-pointer"
                />
                <span>Active & available for passenger bookings</span>
              </label>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={saving}
                  className="bg-[#73d200] hover:bg-[#65b800] text-gray-950 font-bold"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && couponToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Delete Coupon"
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-700">
              Are you sure you want to permanently delete coupon{' '}
              <strong className="text-gray-950 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                {couponToDelete.code}
              </strong>
              ?
            </p>
            <p className="text-gray-500">
              This action cannot be undone. Any previous bookings using this coupon will retain their historical financial discount.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleConfirmDelete}
              >
                Delete Coupon
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
