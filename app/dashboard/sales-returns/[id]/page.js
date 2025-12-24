'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import DashboardLayout from '@/components/DashboardLayout';
import { salesReturnsAPI, shopAPI } from '@/utils/api';

export default function SalesReturnDetail() {
    const { user, loading } = useAuth();
    const router = useRouter();
  const toast = useToast();
    const params = useParams();
    const [salesReturn, setSalesReturn] = useState(null);
    const [shopSettings, setShopSettings] = useState(null);
    const [loadingReturn, setLoadingReturn] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user && params.id) {
            loadSalesReturn();
            loadShopSettings();
        }
    }, [user, loading, router, params.id]);

    const loadSalesReturn = async () => {
        try {
            const data = await salesReturnsAPI.getOne(params.id);
            setSalesReturn(data);
        } catch (error) {
            console.error('Error loading sales return:', error);
            toast.error('Sales return not found');
            router.push('/dashboard/sales-returns');
        } finally {
            setLoadingReturn(false);
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

    if (loading || !user || loadingReturn) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">Loading...</div>
            </DashboardLayout>
        );
    }

    if (!salesReturn) {
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
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                        title="Save as PDF using your browser print dialog"
                    >
                        📥 Save as PDF
                    </button>
                </div>

                {/* Credit Note */}
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
                                <div className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg">
                                    <p className="text-sm font-medium">CREDIT NOTE</p>
                                </div>
                                <p className="mt-4 text-2xl font-bold text-gray-900">
                                    {salesReturn.creditNoteNumber}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Date: {new Date(salesReturn.returnDate).toLocaleDateString('en-IN')}
                                </p>
                                {salesReturn.originalInvoiceNumber && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Original Invoice: {salesReturn.originalInvoiceNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">Customer:</h2>
                        <div className="text-gray-900">
                            <p className="font-semibold text-lg">{salesReturn.customerName}</p>
                            {salesReturn.customerPhone && <p className="text-sm">Phone: {salesReturn.customerPhone}</p>}
                            {salesReturn.customerGstin && (
                                <p className="text-sm">GSTIN: {salesReturn.customerGstin}</p>
                            )}
                        </div>
                    </div>

                    {/* Return Reason */}
                    {salesReturn.reason && (
                        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <p className="text-sm font-semibold text-gray-700">Return Reason:</p>
                            <p className="text-sm text-gray-900">{salesReturn.reason}</p>
                            {salesReturn.reasonDescription && (
                                <p className="text-sm text-gray-600 mt-1">{salesReturn.reasonDescription}</p>
                            )}
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-6">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-y border-gray-300">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">HSN</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Qty</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Price</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">GST %</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {salesReturn.items.map((item, index) => (
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
                                            {item.restocked && (
                                                <div className="text-xs text-green-600">✓ Restocked</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.hsnCode || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity} {item.unit}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{item.sellingPrice.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.gstRate}%</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{item.totalAmount.toFixed(2)}</td>
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
                                    <span className="font-medium text-black">₹{salesReturn.subtotal.toFixed(2)}</span>
                                </div>

                                {salesReturn.taxType === 'CGST_SGST' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">CGST:</span>
                                            <span className="font-medium text-black">₹{salesReturn.totalCGST.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">SGST:</span>
                                            <span className="font-medium text-black">₹{salesReturn.totalSGST.toFixed(2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">IGST:</span>
                                        <span className="font-medium text-black">₹{salesReturn.totalIGST.toFixed(2)}</span>
                                    </div>
                                )}

                                {salesReturn.roundOff !== 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Round Off:</span>
                                        <span className="font-medium text-black">₹{salesReturn.roundOff.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t-2 border-gray-800">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className='text-black'>Credit Amount:</span>
                                        <span className='text-red-600'>₹{salesReturn.grandTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Refund Info */}
                    <div className="mt-6 pt-6 border-t border-gray-300">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Refund Status: </span>
                                <span className={`font-semibold ${salesReturn.refundStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {salesReturn.refundStatus}
                                </span>
                            </div>
                            {salesReturn.refundMethod && (
                                <div>
                                    <span className="text-gray-600">Refund Method: </span>
                                    <span className="font-semibold text-black">{salesReturn.refundMethod}</span>
                                </div>
                            )}
                        </div>
                        {salesReturn.refundedAmount > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                                Refunded Amount: ₹{salesReturn.refundedAmount.toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-300 text-center">
                        <p className="text-sm text-gray-600">This is a computer generated credit note.</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Amount will be credited to customer account or refunded as per payment method.
                        </p>
                    </div>
                </div>
            </div>

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
