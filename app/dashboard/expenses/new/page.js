'use client';

import { useToast } from '@/context/ToastContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { expensesAPI } from '@/utils/api';
import { HiArrowLeft } from 'react-icons/hi';
import Link from 'next/link';

export default function NewExpensePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'MISCELLANEOUS',
    description: '',
    amount: 0,
    gstRate: 0,
    gstAmount: 0,
    vendor: '',
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: ''
  });

  const categories = [
    { value: 'RENT', label: 'Rent' },
    { value: 'SALARY', label: 'Salary' },
    { value: 'ELECTRICITY', label: 'Electricity' },
    { value: 'WATER', label: 'Water' },
    { value: 'TELEPHONE', label: 'Telephone' },
    { value: 'INTERNET', label: 'Internet' },
    { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
    { value: 'BANK_CHARGES', label: 'Bank Charges' },
    { value: 'DEPRECIATION', label: 'Depreciation' },
    { value: 'TAXES', label: 'Taxes' },
    { value: 'REPAIR', label: 'Repair & Maintenance' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
    { value: 'OTHER', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    const gstAmount = (amount * formData.gstRate) / 100;
    const totalAmount = amount + gstAmount;

    setFormData({
      ...formData,
      amount,
      gstAmount,
      totalAmount
    });
  };

  const handleGSTRateChange = (e) => {
    const gstRate = parseFloat(e.target.value) || 0;
    const gstAmount = (formData.amount * gstRate) / 100;
    const totalAmount = formData.amount + gstAmount;

    setFormData({
      ...formData,
      gstRate,
      gstAmount,
      totalAmount
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description) {
      toast.warning('Please enter expense description');
      return;
    }

    if (formData.amount <= 0) {
      toast.warning('Please enter valid amount');
      return;
    }

    setLoading(true);

    try {
      await expensesAPI.create(formData);
      toast.success('Expense added successfully!');
      router.push('/dashboard/expenses');
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.amount + (formData.gstAmount || 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/expenses" className="text-gray-600 hover:text-gray-900">
            <HiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
            <p className="text-gray-500 mt-1">Enter expense details below</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 text-black">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter expense description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Payee
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Vendor or payee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill/Receipt Number
                </label>
                <input
                  type="text"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Bill or receipt number"
                />
              </div>
            </div>
          </div>

          {/* Amount & GST */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Rate (%)
                </label>
                <select
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={handleGSTRateChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="0">No GST (0%)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.gstAmount || 0}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div className="md:col-span-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  name="transactionReference"
                  value={formData.transactionReference}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Cheque no., UTR, transaction ID, etc."
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link
              href="/dashboard/expenses"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
