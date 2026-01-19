'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import DashboardLayout from '@/components/DashboardLayout';
import { TableSkeleton } from '@/components/SkeletonLoader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { invoicesAPI } from '@/utils/api';
import Link from 'next/link';
import { HiEye, HiPencil, HiTrash, HiCurrencyRupee, HiX } from 'react-icons/hi';

export default function Invoices() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [filter, setFilter] = useState('all');

  // Quick payment modal state
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadInvoices();
    }
  }, [user, loading, router, filter]);

  const loadInvoices = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.paymentStatus = filter.toUpperCase();
      }
      const data = await invoicesAPI.getAll(params);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleDelete = async (invoiceId, invoiceNumber) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await invoicesAPI.delete(invoiceId);
      toast.success('Invoice deleted successfully');
      loadInvoices();
    } catch (error) {
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  // Open quick payment modal
  const openQuickPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount || 0);
    setPaymentMethod('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
    setPaymentNotes('');
    setShowQuickPaymentModal(true);
  };

  // Handle quick payment submission
  const handleQuickPaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      const paymentData = {
        amount: paymentAmount,
        paymentMethod,
        paymentDate,
        referenceNumber,
        notes: paymentNotes,
      };

      await invoicesAPI.addPayment(selectedInvoice._id, paymentData);
      toast.success('Payment recorded successfully!');
      setShowQuickPaymentModal(false);
      setSelectedInvoice(null);
      loadInvoices();
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    }
  };

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-1 text-sm text-gray-600">View and manage all invoices</p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            + New Invoice
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'paid', 'unpaid', 'partial'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loadingInvoices ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={6} />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No invoices found. Create your first invoice!
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                        {/* {invoice._id} */}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customerName}
                        </div>
                        {invoice.customerPhone && (
                          <div className="text-xs text-gray-500">{invoice.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{invoice.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.paymentStatus === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : invoice.paymentStatus === 'PARTIAL'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.paymentStatus}
                        </span>
                        {invoice.balanceAmount > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            Bal: ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="inline-flex items-center gap-2">
                          {/* Record Payment Button - Fixed width for alignment */}
                          <div className="w-10">
                            {invoice.balanceAmount > 0 && (
                              <button
                                onClick={() => openQuickPaymentModal(invoice)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                title="Record Payment"
                              >
                                <HiCurrencyRupee className="w-5 h-5" />
                              </button>
                            )}
                          </div>

                          {/* Edit Button - Fixed width for alignment */}
                          <div className="w-10">
                            <Link
                              href={`/dashboard/invoices/${invoice._id}/edit`}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                              title="Edit invoice"
                            >
                              <HiPencil className="w-5 h-5" />
                            </Link>
                          </div>

                          {/* View Button - Always visible */}
                          <div className="w-10">
                            <Link
                              href={`/dashboard/invoices/${invoice._id}`}
                              className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                              title="View details"
                            >
                              <HiEye className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* Quick Payment Modal - Clean & Professional */}
      {showQuickPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowQuickPaymentModal(false)}
            />

            <div className="relative z-50 inline-block w-full max-w-lg p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Record Payment</h3>
                    <p className="text-sm text-green-100 mt-0.5">
                      Invoice: {selectedInvoice.invoiceNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuickPaymentModal(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleQuickPaymentSubmit} className="p-6 space-y-4">
                <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p className="font-semibold text-gray-900">{selectedInvoice.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-semibold text-gray-900">₹{selectedInvoice.grandTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Already Paid:</span>
                      <p className="font-semibold text-green-700">₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance Due:</span>
                      <p className="font-semibold text-rose-700">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      max={selectedInvoice.balanceAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT_NOTE">Credit Note</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Transaction ID, Cheque No., etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="Additional notes (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowQuickPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-sm"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
