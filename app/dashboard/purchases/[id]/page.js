'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import DashboardLayout from '@/components/DashboardLayout';
import PageLoader from '@/components/PageLoader';
import { purchasesAPI, shopAPI } from '@/utils/api';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';

export default function PurchaseDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const params = useParams();
  const [purchase, setPurchase] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [loadingPurchase, setLoadingPurchase] = useState(true);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('add'); // 'add' or 'edit'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  // Info banner state
  const [showInfoBanner, setShowInfoBanner] = useState(false);

  // Initialize info banner state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('paymentInfoDismissed');
    setShowInfoBanner(!dismissed);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && params.id) {
      loadPurchase();
      loadShopSettings();
    }
  }, [user, loading, router, params.id]);

  const loadPurchase = async () => {
    try {
      const data = await purchasesAPI.getOne(params.id);
      setPurchase(data);
    } catch (error) {
      console.error('Error loading purchase:', error);
      toast.error('Purchase not found');
      router.push('/dashboard/purchases');
    } finally {
      setLoadingPurchase(false);
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

  const openAddPaymentModal = () => {
    setPaymentMode('add');
    setPaymentFormData({
      amount: purchase.balanceAmount.toString(),
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: ''
    });
    setSelectedPayment(null);
    setShowPaymentModal(true);
  };

  const openEditPaymentModal = (payment) => {
    setPaymentMode('edit');
    setSelectedPayment(payment);
    setPaymentFormData({
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || ''
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);

    try {
      const paymentData = {
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        paymentDate: paymentFormData.paymentDate,
        referenceNumber: paymentFormData.referenceNumber,
        notes: paymentFormData.notes
      };

      if (paymentMode === 'add') {
        await purchasesAPI.addPayment(params.id, paymentData);
        toast.success('Payment added successfully!');
      } else {
        await purchasesAPI.editPayment(params.id, selectedPayment._id, paymentData);
        toast.success('Payment updated successfully!');
      }

      setShowPaymentModal(false);
      loadPurchase();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    try {
      await purchasesAPI.deletePayment(params.id, deletingPaymentId);
      toast.success('Payment deleted successfully!');
      setShowDeleteConfirm(false);
      setDeletingPaymentId(null);
      loadPurchase();
    } catch (error) {
      console.error('Delete payment error:', error);
      toast.error(error.message || 'An error occurred');
    }
  };

  const openDeleteConfirmation = (paymentId) => {
    setDeletingPaymentId(paymentId);
    setShowDeleteConfirm(true);
  };

  if (loading || !user || loadingPurchase) {
    return <PageLoader text="Loading purchase details..." />;
  }

  if (!purchase) {
    return null;
  }

  const paymentHistory = purchase.payments || [];

  const dismissInfoBanner = () => {
    localStorage.setItem('paymentInfoDismissed', 'true');
    setShowInfoBanner(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Info Banner - First Time User Guide */}
        {showInfoBanner && purchase.balanceAmount > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5 no-print shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-blue-900">💡 How to Track Payments?</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-2">This purchase has a pending balance. You can now track partial/multiple payments:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><strong>Record Payment:</strong> Click the big "Record Payment" button below</li>
                    <li><strong>Enter Details:</strong> Add amount, payment method, date & reference</li>
                    <li><strong>Track History:</strong> View all payments in the Payment History table</li>
                    <li><strong>Edit/Delete:</strong> Use the pencil/trash icons to manage payments</li>
                  </ol>
                  <p className="mt-2 font-semibold">→ Payments automatically update ledger & supplier balance!</p>
                </div>
              </div>
              <button
                onClick={dismissInfoBanner}
                className="flex-shrink-0 ml-4 text-blue-400 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center no-print">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back
          </button>
          <div className="flex gap-3">
            {!purchase.isReturned && (
              <button
                onClick={() => router.push(`/dashboard/purchases/${params.id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                title="Edit purchase items and quantities"
              >
                ✏️ Edit Items
              </button>
            )}
            {purchase.isReturned && (
              <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed" title="Cannot edit purchases with returns">
                ✏️ Edit Items (Has Returns)
              </div>
            )}
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              title="Save as PDF using your browser's print dialog"
            >
              📥 Save as PDF
            </button>
          </div>
        </div>

        {/* Payment Status Banner - Prominent */}
        <div className={`rounded-xl shadow-lg p-6 no-print ${
          purchase.paymentStatus === 'PAID'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : purchase.paymentStatus === 'PARTIAL'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
            : 'bg-gradient-to-r from-red-500 to-pink-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                {purchase.paymentStatus === 'PAID' ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1">Payment Status: {purchase.paymentStatus}</h3>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="opacity-90">Grand Total: </span>
                    <span className="font-bold">₹{purchase.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="opacity-90">Paid: </span>
                    <span className="font-bold">₹{purchase.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {purchase.balanceAmount > 0 && (
                    <div>
                      <span className="opacity-90">Balance: </span>
                      <span className="font-bold">₹{purchase.balanceAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {purchase.balanceAmount > 0 && (
              <button
                onClick={openAddPaymentModal}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 flex items-center gap-2 shadow-xl transform hover:scale-105 transition-all"
              >
                <HiPlus className="w-6 h-6" />
                Record Payment
              </button>
            )}

            {purchase.balanceAmount <= 0 && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fully Paid
              </div>
            )}
          </div>
        </div>

        {/* Payment History Section - Premium Design */}
        {paymentHistory.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-300 p-6 no-print">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  💳 Payment History
                  <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                    {paymentHistory.length} {paymentHistory.length === 1 ? 'Payment' : 'Payments'}
                  </span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">All payments recorded for this purchase. Click edit/delete icons to manage.</p>
              </div>
              {purchase.balanceAmount > 0 && (
                <button
                  onClick={openAddPaymentModal}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all"
                >
                  <HiPlus className="w-5 h-5" />
                  Add More Payment
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment, index) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">
                          ₹{payment.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payment.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditPaymentModal(payment)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Payment"
                          >
                            <HiPencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(payment._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Payment"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500 uppercase">Total Payments</div>
                  <div className="text-xl font-bold text-gray-900">{paymentHistory.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Paid Amount</div>
                  <div className="text-xl font-bold text-green-600">
                    ₹{purchase.paidAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Balance Due</div>
                  <div className={`text-xl font-bold ${purchase.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{purchase.balanceAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Payments Yet - Enhanced Call to Action */}
        {paymentHistory.length === 0 && purchase.balanceAmount > 0 && (
          <div className="bg-white rounded-xl shadow-2xl border-2 border-dashed border-orange-300 p-10 text-center no-print relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full -mr-32 -mt-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-100 to-emerald-100 rounded-full -ml-24 -mb-24 opacity-50"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-3">Track Your Payments Here! 💰</h3>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 inline-block">
                <p className="text-red-700 font-semibold text-lg">
                  Balance Pending: ₹{purchase.balanceAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Record partial or full payments as you receive them from suppliers.
                <br/>
                Each payment is tracked separately with date, method, and reference number.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Multiple Payments
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Payment History
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Edit & Delete
                </div>
              </div>

              <button
                onClick={openAddPaymentModal}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-3 mx-auto shadow-2xl transform hover:scale-105 transition-all"
              >
                <HiPlus className="w-6 h-6" />
                Click Here to Record Payment
                <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Purchase Document */}
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
                <div className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg">
                  <p className="text-sm font-medium">PURCHASE INVOICE</p>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {purchase.purchaseNumber}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Date: {new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}
                </p>
                {purchase.supplierInvoiceNo && (
                  <p className="text-sm text-gray-600">
                    Supplier Invoice: {purchase.supplierInvoiceNo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Supplier Details */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">Supplier:</h2>
            <div className="text-gray-900">
              <p className="font-semibold text-lg">{purchase.supplierName}</p>
              {purchase.supplier?.phone && <p className="text-sm">Phone: {purchase.supplier.phone}</p>}
              {purchase.supplier?.address && <p className="text-sm">{purchase.supplier.address}</p>}
              {purchase.supplierGstin && (
                <p className="text-sm">GSTIN: {purchase.supplierGstin}</p>
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
                {purchase.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      {(item.batchNo || item.batch?.batchNo) && (
                        <div className="text-xs text-gray-500">Batch: {item.batchNo || item.batch?.batchNo}</div>
                      )}
                      {(item.expiryDate || item.batch?.expiryDate) && (
                        <div className="text-xs text-gray-500">
                          Exp: {new Date(item.expiryDate || item.batch?.expiryDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                      {item.freeQuantity > 0 && (
                        <div className="text-xs text-green-600">Free: {item.freeQuantity}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.hsnCode || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ₹{item.purchasePrice.toFixed(2)}
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
                  <span className="font-medium text-black">₹{purchase.subtotal.toFixed(2)}</span>
                </div>

                {purchase.taxType === 'CGST_SGST' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium text-black">₹{purchase.totalCGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium text-black">₹{purchase.totalSGST.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IGST:</span>
                    <span className="font-medium text-black">₹{purchase.totalIGST.toFixed(2)}</span>
                  </div>
                )}

                {purchase.freight > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Freight:</span>
                    <span className="font-medium text-black">₹{purchase.freight.toFixed(2)}</span>
                  </div>
                )}

                {purchase.packaging > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Packaging:</span>
                    <span className="font-medium text-black">₹{purchase.packaging.toFixed(2)}</span>
                  </div>
                )}

                {purchase.otherCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Charges:</span>
                    <span className="font-medium text-black">₹{purchase.otherCharges.toFixed(2)}</span>
                  </div>
                )}

                {purchase.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-medium text-black">-₹{purchase.discount.toFixed(2)}</span>
                  </div>
                )}

                {purchase.roundOff !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Round Off:</span>
                    <span className="font-medium text-black">₹{purchase.roundOff.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t-2 border-gray-800">
                  <div className="flex justify-between text-lg font-bold">
                    <span className='text-black'>Grand Total:</span>
                    <span className='text-black'>₹{purchase.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium text-green-600">
                      ₹{purchase.paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {purchase.balanceAmount > 0 && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className="font-bold text-red-600">
                        ₹{purchase.balanceAmount.toLocaleString('en-IN')}
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
                    purchase.paymentStatus === 'PAID'
                      ? 'text-green-600'
                      : purchase.paymentStatus === 'PARTIAL'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {purchase.paymentStatus}
                </span>
              </div>

              {/* Payment History */}
              {purchase.payments && purchase.payments.length > 0 ? (
                <div>
                  <span className="text-gray-600">Payment Details: </span>
                  <span className="text-black">
                    {purchase.payments.map((payment, index) => (
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
                  <span className="font-semibold text-black">{purchase.paymentMethod}</span>
                </div>
              )}
            </div>

            {purchase.notes && (
              <p className="text-sm text-gray-600 mt-3">Notes: {purchase.notes}</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-sm text-gray-600">Thank you!</p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer generated document.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal - Premium Design */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setShowPaymentModal(false)}
            />

            <div className="relative z-50 inline-block w-full max-w-lg p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {paymentMode === 'add' ? 'Add Payment' : 'Edit Payment'}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    max={paymentMode === 'add' ? purchase.balanceAmount : purchase.balanceAmount + (selectedPayment?.amount || 0)}
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max: ₹{(paymentMode === 'add' ? purchase.balanceAmount : purchase.balanceAmount + (selectedPayment?.amount || 0)).toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_NOTE">Credit Note</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.referenceNumber}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Cheque/Transaction number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-2.5 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPayment ? 'Processing...' : paymentMode === 'add' ? 'Add Payment' : 'Update Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />

            <div className="relative z-50 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <HiTrash className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                Delete Payment?
              </h3>
              <p className="text-sm text-center text-gray-500 mb-6">
                Are you sure you want to delete this payment? This action cannot be undone and will update the purchase balance.
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2.5 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePayment}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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
