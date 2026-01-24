'use client';
// Ledgers & Accounting Page
import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { HiDownload, HiDocumentReport, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { shopAPI, customersAPI, invoicesAPI } from '@/utils/api';
import * as XLSX from 'xlsx';

export default function LedgersPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('customerLedger');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [ledgerData, setLedgerData] = useState(null);
    const [shopName, setShopName] = useState('Billing Software');
    const [shopSettings, setShopSettings] = useState(null);
    const [expandedCustomers, setExpandedCustomers] = useState({});

    // Fetch shop settings and update page title
    useEffect(() => {
        const loadShopSettings = async () => {
            try {
                const settings = await shopAPI.get();
                setShopSettings(settings);
                if (settings && settings.shopName) {
                    const appTitle = `${settings.shopName} - Billing Software`;
                    setShopName(settings.shopName);
                    document.title = appTitle;
                }
            } catch (error) {
                console.error('Error loading shop settings:', error);
            }
        };
        loadShopSettings();
    }, []);

    const tabs = [
        { id: 'customerLedger', name: 'Customer Ledger', description: 'Receivables' },
        { id: 'supplierLedger', name: 'Supplier Ledger', description: 'Payables' },
        { id: 'cashLedger', name: 'Cash Ledger', description: 'Cash Book' },
        { id: 'bankLedger', name: 'Bank Ledger', description: 'Bank Book' },
        { id: 'trialBalance', name: 'Trial Balance', description: 'All Accounts' },
        { id: 'profitLoss', name: 'P&L Statement', description: 'Income & Expenses' },
        { id: 'balanceSheet', name: 'Balance Sheet', description: 'Assets & Liabilities' }
    ];

    const generateLedger = async () => {
        if (!dateRange.startDate || !dateRange.endDate) {
            toast.warning('Please select both start and end dates');
            return;
        }

        setLoading(true);
        setLedgerData(null);

        try {
            if (activeTab === 'customerLedger') {
                // Fetch customers and invoices
                const [customers, invoices] = await Promise.all([
                    customersAPI.getAll(),
                    invoicesAPI.getAll({
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    })
                ]);

                // Group invoices by customer
                const customerLedgers = {};

                customers.forEach(customer => {
                    customerLedgers[customer._id] = {
                        customerId: customer._id,
                        customerName: customer.name,
                        customerPhone: customer.phone,
                        openingBalance: 0, // Could be calculated from invoices before start date
                        transactions: [],
                        closingBalance: 0
                    };
                });

                // Add invoice transactions
                invoices.forEach(invoice => {
                    const customerId = invoice.customerId || invoice.customer?._id;
                    if (customerId && customerLedgers[customerId]) {
                        // Add invoice as debit
                        customerLedgers[customerId].transactions.push({
                            date: invoice.invoiceDate,
                            type: 'Invoice',
                            reference: invoice.invoiceNumber,
                            debit: invoice.grandTotal,
                            credit: 0,
                            invoiceId: invoice._id,
                            paymentStatus: invoice.paymentStatus,
                            paidAmount: invoice.paidAmount || 0,
                            balanceAmount: invoice.balanceAmount || 0
                        });

                        // Add payments as credit
                        if (invoice.payments && invoice.payments.length > 0) {
                            invoice.payments.forEach(payment => {
                                customerLedgers[customerId].transactions.push({
                                    date: payment.paymentDate || payment.date,
                                    type: 'Payment',
                                    reference: `${invoice.invoiceNumber} - ${payment.paymentMethod}`,
                                    debit: 0,
                                    credit: payment.amount,
                                    paymentMethod: payment.paymentMethod,
                                    referenceNumber: payment.referenceNumber
                                });
                            });
                        }
                    }
                });

                // Calculate running balances and sort transactions
                Object.values(customerLedgers).forEach(ledger => {
                    // Sort transactions by date
                    ledger.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

                    // Calculate running balance
                    let runningBalance = ledger.openingBalance;
                    ledger.transactions.forEach(txn => {
                        runningBalance += txn.debit - txn.credit;
                        txn.balance = runningBalance;
                    });

                    ledger.closingBalance = runningBalance;
                });

                // Filter out customers with no transactions
                const ledgerArray = Object.values(customerLedgers)
                    .filter(ledger => ledger.transactions.length > 0)
                    .sort((a, b) => a.customerName.localeCompare(b.customerName));

                setLedgerData(ledgerArray);
                toast.success('Customer Ledger generated successfully!');
            } else {
                // Placeholder for other ledger types
                toast.info('This ledger type will be implemented soon');
            }
        } catch (error) {
            console.error('Error generating ledger:', error);
            toast.error(error.message || 'Failed to generate ledger');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (format) => {
        if (!ledgerData) {
            toast.warning('Please generate a ledger first');
            return;
        }

        if (format === 'pdf') {
            toast.info('Tip: Turn OFF "Headers and footers" in print dialog for a clean PDF', 8000);
            window.print();
            return;
        }

        if (format === 'excel') {
            exportToExcel();
        }

        if (format === 'json') {
            exportToJSON();
        }
    };

    const exportToJSON = () => {
        const ledgerName = tabs.find(t => t.id === activeTab)?.name || 'Ledger';
        const dateStr = `${dateRange.startDate}_to_${dateRange.endDate}`;

        const jsonData = {
            ledgerType: ledgerName,
            ledgerId: activeTab,
            generatedAt: new Date().toISOString(),
            period: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            },
            data: ledgerData
        };

        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${ledgerName}_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToExcel = () => {
        const ledgerName = tabs.find(t => t.id === activeTab)?.name || 'Ledger';
        const dateStr = `${dateRange.startDate}_to_${dateRange.endDate}`;

        // TODO: Implement Excel export for each ledger type
        toast.info('Excel export will be implemented with backend integration');
        console.log('📊 Exporting to Excel:', ledgerName, dateStr);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center no-print">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Ledgers & Accounting</h1>
                        <p className="text-gray-500 mt-1">View and manage all accounting ledgers and financial statements</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleExport('excel')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <HiDownload className="w-5 h-5" />
                            Export Excel
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                            <HiDownload className="w-5 h-5" />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* PDF Export Help Banner */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 no-print">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-amber-800">
                                📄 For clean PDF exports: Turn OFF &quot;Headers and footers&quot; in your browser&apos;s print dialog
                            </p>
                            <p className="mt-1 text-xs text-amber-700">
                                This removes the browser-generated date/time text that appears at the top of PDFs
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-lg shadow p-6 no-print">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={generateLedger}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Generating...' : 'Generate Ledger'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow print-content">
                    {/* Print-only header */}
                    <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative h-16 w-40">
                                <img
                                    src="/Logo.jpeg"
                                    alt={shopName}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {tabs.find(t => t.id === activeTab)?.name}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    {shopSettings?.shopName || shopName}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>
                                <strong>Period:</strong> {new Date(dateRange.startDate).toLocaleDateString('en-IN')} to {new Date(dateRange.endDate).toLocaleDateString('en-IN')}
                            </p>
                            <p className="mt-1">
                                <strong>Generated on:</strong> {new Date().toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="border-b border-gray-200 no-print">
                        <nav className="flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span>{tab.name}</span>
                                        <span className="text-xs text-gray-400 mt-1">{tab.description}</span>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'customerLedger' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 no-print">Customer Ledger</h3>
                                <p className="text-gray-600 mb-6 no-print">Track all customer transactions and outstanding receivables</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view customer ledger</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show all customer transactions, invoices, and payments</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}

                                {ledgerData && ledgerData.length > 0 && (
                                    <div className="space-y-4">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print mb-6">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <p className="text-sm text-blue-600 font-medium">Total Customers</p>
                                                <p className="text-2xl font-bold text-blue-900">{ledgerData.length}</p>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <p className="text-sm text-green-600 font-medium">Total Invoices</p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {ledgerData.reduce((sum, ledger) => sum + ledger.transactions.filter(t => t.type === 'Invoice').length, 0)}
                                                </p>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-sm text-red-600 font-medium">Total Outstanding</p>
                                                <p className="text-2xl font-bold text-red-900">
                                                    ₹{ledgerData.reduce((sum, ledger) => sum + ledger.closingBalance, 0).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Customer Ledgers */}
                                        <div className="space-y-3">
                                            {ledgerData.map((customerLedger) => (
                                                <div key={customerLedger.customerId} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    {/* Customer Header - Clickable */}
                                                    <button
                                                        onClick={() => setExpandedCustomers(prev => ({
                                                            ...prev,
                                                            [customerLedger.customerId]: !prev[customerLedger.customerId]
                                                        }))}
                                                        className="w-full bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 p-4 flex items-center justify-between transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {expandedCustomers[customerLedger.customerId] ? (
                                                                <HiChevronDown className="w-5 h-5 text-gray-500" />
                                                            ) : (
                                                                <HiChevronRight className="w-5 h-5 text-gray-500" />
                                                            )}
                                                            <div className="text-left">
                                                                <p className="font-semibold text-gray-900">{customerLedger.customerName}</p>
                                                                <p className="text-sm text-gray-500">{customerLedger.customerPhone}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">Transactions</p>
                                                                <p className="font-semibold text-gray-900">{customerLedger.transactions.length}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">Closing Balance</p>
                                                                <p className={`font-bold ${customerLedger.closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    ₹{customerLedger.closingBalance.toLocaleString('en-IN')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Transactions Table - Expandable */}
                                                    {expandedCustomers[customerLedger.customerId] && (
                                                        <div className="border-t border-gray-200">
                                                            <table className="w-full">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Reference</th>
                                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Debit (₹)</th>
                                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Credit (₹)</th>
                                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Balance (₹)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    {/* Opening Balance */}
                                                                    {customerLedger.openingBalance !== 0 && (
                                                                        <tr className="bg-blue-50">
                                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                                {new Date(dateRange.startDate).toLocaleDateString('en-IN')}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm font-medium text-blue-700" colSpan="2">
                                                                                Opening Balance
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-right">-</td>
                                                                            <td className="px-4 py-2 text-sm text-right">-</td>
                                                                            <td className="px-4 py-2 text-sm text-right font-semibold text-blue-700">
                                                                                {customerLedger.openingBalance.toLocaleString('en-IN')}
                                                                            </td>
                                                                        </tr>
                                                                    )}

                                                                    {/* Transactions */}
                                                                    {customerLedger.transactions.map((txn, idx) => (
                                                                        <tr key={idx} className="hover:bg-gray-50">
                                                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                                                {new Date(txn.date).toLocaleDateString('en-IN')}
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${txn.type === 'Invoice'
                                                                                        ? 'bg-orange-100 text-orange-700'
                                                                                        : 'bg-green-100 text-green-700'
                                                                                    }`}>
                                                                                    {txn.type}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-gray-900">{txn.reference}</td>
                                                                            <td className="px-4 py-2 text-sm text-right font-medium text-red-600">
                                                                                {txn.debit > 0 ? txn.debit.toLocaleString('en-IN') : '-'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-right font-medium text-green-600">
                                                                                {txn.credit > 0 ? txn.credit.toLocaleString('en-IN') : '-'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                                                                                {txn.balance.toLocaleString('en-IN')}
                                                                            </td>
                                                                        </tr>
                                                                    ))}

                                                                    {/* Closing Balance */}
                                                                    <tr className="bg-gray-100 font-semibold">
                                                                        <td className="px-4 py-2 text-sm text-gray-600">
                                                                            {new Date(dateRange.endDate).toLocaleDateString('en-IN')}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900" colSpan="2">
                                                                            Closing Balance
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-right text-red-600">
                                                                            {customerLedger.transactions.reduce((sum, t) => sum + t.debit, 0).toLocaleString('en-IN')}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-right text-green-600">
                                                                            {customerLedger.transactions.reduce((sum, t) => sum + t.credit, 0).toLocaleString('en-IN')}
                                                                        </td>
                                                                        <td className={`px-4 py-2 text-sm text-right font-bold ${customerLedger.closingBalance > 0 ? 'text-red-600' : 'text-green-600'
                                                                            }`}>
                                                                            {customerLedger.closingBalance.toLocaleString('en-IN')}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {ledgerData && ledgerData.length === 0 && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No customer transactions found for the selected period</p>
                                        <p className="text-sm text-gray-400 mt-2">Try selecting a different date range</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'supplierLedger' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Supplier Ledger</h3>
                                <p className="text-gray-600 mb-6">Track all supplier transactions and outstanding payables</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view supplier ledger</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show all supplier transactions, purchases, and payments</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'cashLedger' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cash Ledger</h3>
                                <p className="text-gray-600 mb-6">Track all cash transactions (Cash Book)</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view cash ledger</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show all cash receipts and payments</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bankLedger' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Bank Ledger</h3>
                                <p className="text-gray-600 mb-6">Track all bank transactions (Bank Book)</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view bank ledger</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show all bank deposits and withdrawals</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'trialBalance' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Trial Balance</h3>
                                <p className="text-gray-600 mb-6">Summary of all account balances</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view trial balance</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show debit and credit balances for all accounts</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'profitLoss' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
                                <p className="text-gray-600 mb-6">Income and expenses summary</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view P&L statement</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show revenue, expenses, and net profit/loss</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'balanceSheet' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Balance Sheet</h3>
                                <p className="text-gray-600 mb-6">Assets, liabilities, and equity</p>

                                {!ledgerData && !loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a date range and click &quot;Generate Ledger&quot; to view balance sheet</p>
                                        <p className="text-sm text-gray-400 mt-2">This will show assets, liabilities, and owner&apos;s equity</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <LoadingSpinner size="lg" text="Generating ledger..." />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            box-shadow: none !important;
          }
        }
      `}</style>
        </DashboardLayout>
    );
}
