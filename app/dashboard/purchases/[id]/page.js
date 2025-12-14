'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { purchasesAPI, shopAPI } from '@/utils/api';

export default function PurchaseDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [purchase, setPurchase] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  const [loadingPurchase, setLoadingPurchase] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

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
      alert('Purchase not found');
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
      alert('💡 Tip: In the print dialog:\n\n1. Select "Save as PDF" as destination\n2. In "More settings", turn OFF "Headers and footers"\n3. Click Save\n\n(This message won\'t show again)');
      localStorage.setItem('pdfPrintTipSeen', 'true');
    }
    window.print();
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      await purchasesAPI.updatePayment(params.id, {
        paidAmount: paymentAmount,
        paymentMethod,
      });
      setShowPaymentModal(false);
      loadPurchase();
      alert('Payment updated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading || !user || loadingPurchase) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!purchase) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center no-print">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back
          </button>
          <div className="flex gap-3">
            {purchase.balanceAmount > 0 && (
              <button
                onClick={() => {
                  setPaymentAmount(purchase.balanceAmount);
                  setShowPaymentModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Update Payment
              </button>
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

        {/* Purchase Document */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 invoice-print">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
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
                      {item.batchNo && (
                        <div className="text-xs text-gray-500">Batch: {item.batchNo}</div>
                      )}
                      {item.expiryDate && (
                        <div className="text-xs text-gray-500">
                          Exp: {new Date(item.expiryDate).toLocaleDateString('en-IN')}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
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
              <div>
                <span className="text-gray-600">Payment Method: </span>
                <span className="font-semibold text-black">{purchase.paymentMethod}</span>
              </div>
            </div>
            {purchase.notes && (
              <p className="text-sm text-gray-600 mt-2">Notes: {purchase.notes}</p>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowPaymentModal(false)}
            />

            <div className="relative z-50 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Update Payment
              </h3>

              <form onSubmit={handleUpdatePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max={purchase.balanceAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Balance Due: ₹{purchase.balanceAmount.toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Update Payment
                  </button>
                </div>
              </form>
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
