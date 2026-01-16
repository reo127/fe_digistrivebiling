'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import DashboardLayout from '@/components/DashboardLayout';
import PageLoader from '@/components/PageLoader';
import { invoicesAPI, shopAPI } from '@/utils/api';
import { HiPlus, HiPencil, HiTrash, HiX, HiCurrencyRupee } from 'react-icons/hi';

export default function InvoiceDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && params.id) {
      loadInvoice();
      loadShopSettings();
    }
  }, [user, loading, router, params.id]);

  const loadInvoice = async () => {
    try {
      const data = await invoicesAPI.getOne(params.id);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Invoice not found');
      router.push('/dashboard/invoices');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadShopSettings = async () => {
    try {
      const data = await shopAPI.get();
      setShopSettings(data);
    } catch (error) {
      console.error('Error loading shop settings:', error);
    }
  };

  const handleDownload = () => {
    const hasSeenTip = localStorage.getItem('pdfPrintTipSeen');
    if (!hasSeenTip) {
      toast.info('Tip: Turn OFF "Headers and footers" in print dialog for clean PDF', 6000);
      localStorage.setItem('pdfPrintTipSeen', 'true');
    }
    window.print();
  };

  // Open modal to add new payment
  const openAddPaymentModal = () => {
    setEditingPaymentId(null);
    setPaymentAmount(invoice?.balanceAmount || 0);
    setPaymentMethod('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Open modal to edit existing payment
  const openEditPaymentModal = (payment) => {
    setEditingPaymentId(payment._id);
    setPaymentAmount(payment.amount);
    setPaymentMethod(payment.paymentMethod);
    setPaymentDate(new Date(payment.paymentDate).toISOString().split('T')[0]);
    setReferenceNumber(payment.referenceNumber || '');
    setPaymentNotes(payment.notes || '');
    setShowPaymentModal(true);
  };

  // Handle add/edit payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      const paymentData = {
        amount: paymentAmount,
        paymentMethod,
        paymentDate,
        referenceNumber,
        notes: paymentNotes,
      };

      if (editingPaymentId) {
        await invoicesAPI.editPayment(params.id, editingPaymentId, paymentData);
        toast.success('Payment updated successfully!');
      } else {
        await invoicesAPI.addPayment(params.id, paymentData);
        toast.success('Payment recorded successfully!');
      }

      setShowPaymentModal(false);
      loadInvoice();
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (paymentId) => {
    setDeletingPaymentId(paymentId);
    setShowDeleteModal(true);
  };

  // Handle delete payment
  const handleDeletePayment = async () => {
    try {
      await invoicesAPI.deletePayment(params.id, deletingPaymentId);
      toast.success('Payment deleted successfully!');
      setShowDeleteModal(false);
      setDeletingPaymentId(null);
      loadInvoice();
    } catch (error) {
      toast.error(error.message || 'Failed to delete payment');
    }
  };

  if (loading || !user || loadingInvoice) {
    return <PageLoader text="Loading invoice details..." />;
  }

  if (!invoice) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center no-print">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            title="Save as PDF using your browser's print dialog"
          >
            📥 Save as PDF
          </button>
        </div>

        {/* Payment Status Banner - Clean & Subtle */}
        <div className={`rounded-xl shadow-sm border-2 p-6 no-print transition-all ${
          invoice.paymentStatus === 'PAID'
            ? 'bg-green-50 border-green-200'
            : invoice.paymentStatus === 'PARTIAL'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className={`text-xl font-semibold ${
                  invoice.paymentStatus === 'PAID'
                    ? 'text-green-800'
                    : invoice.paymentStatus === 'PARTIAL'
                    ? 'text-amber-800'
                    : 'text-rose-800'
                }`}>
                  {invoice.paymentStatus === 'PAID' ? '✓ Fully Paid' :
                   invoice.paymentStatus === 'PARTIAL' ? '⚠ Partially Paid' :
                   '○ Unpaid'}
                </h3>
              </div>
              <div className="flex gap-6 mt-2 text-sm text-gray-700">
                <div>Total: <span className="font-semibold">₹{invoice.grandTotal.toLocaleString('en-IN')}</span></div>
                <div>Paid: <span className="font-semibold text-green-700">₹{invoice.paidAmount.toLocaleString('en-IN')}</span></div>
                {invoice.balanceAmount > 0 && (
                  <div>Balance: <span className="font-semibold text-rose-700">₹{invoice.balanceAmount.toLocaleString('en-IN')}</span></div>
                )}
              </div>
            </div>
            {invoice.balanceAmount > 0 && (
              <button
                onClick={openAddPaymentModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm"
              >
                <HiCurrencyRupee className="w-5 h-5" />
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Payment History - Clean & Professional */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              <p className="text-sm text-gray-600 mt-0.5">All payments received for this invoice</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.payments.map((payment, index) => (
                    <tr key={payment._id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-green-700">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">
                        {payment.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditPaymentModal(payment)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit payment"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(payment._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete payment"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoice */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 invoice-print">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                {/* Logo */}
                {shopSettings?.logo && (
                  <div className="mb-3">
                    <img
                      src={shopSettings.logo}
                      alt={shopSettings.shopName || 'Shop Logo'}
                      className="h-16 object-contain"
                    />
                  </div>
                )}

                {/* Shop Details */}
                <h1 className="text-3xl font-bold text-gray-900">
                  {shopSettings?.shopName || 'Medical Store'}
                </h1>
                {shopSettings && (
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>{shopSettings.address}</p>
                    <p>
                      {shopSettings.city}, {shopSettings.state} - {shopSettings.pincode}
                    </p>
                    <p>Phone: {shopSettings.phone}</p>
                    {shopSettings.email && <p>Email: {shopSettings.email}</p>}
                    <p className="font-semibold">GSTIN: {shopSettings.gstin}</p>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
                  <p className="text-sm font-medium">TAX INVOICE</p>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">Bill To:</h2>
            <div className="text-gray-900">
              <p className="font-semibold text-lg">{invoice.customerName}</p>
              {invoice.customerPhone && <p className="text-sm">Phone: {invoice.customerPhone}</p>}
              {invoice.customerAddress && <p className="text-sm">{invoice.customerAddress}</p>}
              {invoice.customerGstin && (
                <p className="text-sm">GSTIN: {invoice.customerGstin}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full">
              <thead className="bg-gray-100 border-y border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    HSN
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    GST %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      {(item.batchNo || item.expiryDate) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.batchNo && <span>Batch: {item.batchNo}</span>}
                          {item.batchNo && item.expiryDate && <span> | </span>}
                          {item.expiryDate && <span>Exp: {new Date(item.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.hsnCode || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ₹{item.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.gstRate}%
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-black">₹{invoice.subtotal.toFixed(2)}</span>
                </div>

                {invoice.taxType === 'CGST_SGST' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium text-black">₹{invoice.totalCGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium text-black">₹{invoice.totalSGST.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IGST:</span>
                    <span className="font-medium text-black">₹{invoice.totalIGST.toFixed(2)}</span>
                  </div>
                )}

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-medium text-black">-₹{invoice.discount.toFixed(2)}</span>
                  </div>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Round Off:</span>
                    <span className="font-medium text-black">₹{invoice.roundOff.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t-2 border-gray-800">
                  <div className="flex justify-between text-lg font-bold">
                    <span className='text-black'>Grand Total:</span>
                    <span className='text-black'>₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium text-green-600">
                      ₹{invoice.paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {invoice.balanceAmount > 0 && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className="font-bold text-red-600">
                        ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 pt-6 border-t border-gray-300">
            <div className="text-sm">
              <div className="mb-3">
                <span className="text-gray-600">Payment Status: </span>
                <span
                  className={`font-semibold ${
                    invoice.paymentStatus === 'PAID'
                      ? 'text-green-600'
                      : invoice.paymentStatus === 'PARTIAL'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {invoice.paymentStatus}
                </span>
              </div>

              {/* Payment History */}
              {invoice.payments && invoice.payments.length > 0 ? (
                <div>
                  <span className="text-gray-600">Payment Details: </span>
                  <span className="text-black">
                    {invoice.payments.map((payment, index) => (
                      <span key={index}>
                        {index > 0 && ', '}
                        ₹{payment.amount.toLocaleString('en-IN')} via {payment.paymentMethod}
                        {' '}on {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                        {payment.referenceNumber && ` (Ref: ${payment.referenceNumber})`}
                      </span>
                    ))}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-gray-600">Payment Method: </span>
                  <span className="font-semibold text-black">{invoice.paymentMethod}</span>
                </div>
              )}
            </div>

            {invoice.notes && (
              <p className="text-sm text-gray-600 mt-3">Notes: {invoice.notes}</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer generated invoice and does not require signature.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal - Clean & Professional */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowPaymentModal(false)}
            />

            <div className="relative z-50 inline-block w-full max-w-lg p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {editingPaymentId ? 'Edit Payment' : 'Record Payment'}
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-green-100 mt-1">
                  {editingPaymentId ? 'Update payment details' : 'Add a new payment for this invoice'}
                </p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
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
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {!editingPaymentId && invoice.balanceAmount > 0 && (
                    <p className="text-xs text-gray-600 mt-1.5">
                      Balance Due: ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

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
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-sm"
                  >
                    {editingPaymentId ? 'Update Payment' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            />

            <div className="relative z-50 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                  <HiTrash className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Payment
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this payment? This will update the invoice balance and cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePayment}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                >
                  Delete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          * {
            visibility: hidden;
          }

          .invoice-print,
          .invoice-print * {
            visibility: visible;
          }

          html, body {
            width: 210mm;
            height: auto;
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white;
          }

          .no-print {
            display: none !important;
          }

          /* Make invoice full width and properly positioned */
          .invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 15mm;
            margin: 0;
            width: 210mm;
            max-width: 210mm;
            background: white;
          }

          /* Prevent awkward page breaks */
          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          /* Avoid breaking these elements across pages */
          .border-b-2,
          .space-y-2,
          .pt-3 {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
