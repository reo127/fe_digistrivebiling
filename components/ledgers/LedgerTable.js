'use client';

import React from 'react';
import { HiChevronDown, HiChevronRight } from 'react-icons/hi';

/**
 * Reusable ledger table component with expandable rows
 * Displays entity ledgers with transactions in an expandable table format
 */
export default function LedgerTable({
    ledgerData = [],
    expandedItems = {},
    setExpandedItems,
    dateRange,
    config = {}
}) {
    // Default configuration
    const {
        entityIdKey = 'customerId',
        entityNameKey = 'customerName',
        entityPhoneKey = 'customerPhone',
        transactionTypeColors = {
            Invoice: 'bg-blue-100 text-blue-700',
            Payment: 'bg-green-100 text-green-700',
            Purchase: 'bg-orange-100 text-orange-700'
        },
        debitLabel = 'Debit',
        creditLabel = 'Credit',
        balancePositiveColor = 'text-red-600', // Positive balance (they owe us or we owe them)
        balanceNegativeColor = 'text-green-600' // Negative balance (settled)
    } = config;

    const toggleExpand = (entityId) => {
        setExpandedItems(prev => ({
            ...prev,
            [entityId]: !prev[entityId]
        }));
    };

    if (!ledgerData || ledgerData.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {ledgerData.map((ledger) => {
                const entityId = ledger[entityIdKey];
                const entityName = ledger[entityNameKey];
                const entityPhone = ledger[entityPhoneKey];
                const isExpanded = expandedItems[entityId];

                return (
                    <div key={entityId} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Entity Header - Clickable */}
                        <button
                            onClick={() => toggleExpand(entityId)}
                            className="w-full bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 p-4 flex items-center justify-between transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <HiChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <HiChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">{entityName}</p>
                                    <p className="text-sm text-gray-500">{entityPhone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Transactions</p>
                                    <p className="font-semibold text-gray-900">{ledger.transactions.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Closing Balance</p>
                                    <p className={`font-bold ${ledger.closingBalance > 0 ? balancePositiveColor : balanceNegativeColor}`}>
                                        ₹{ledger.closingBalance.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Transactions Table - Expandable */}
                        {isExpanded && (
                            <div className="border-t border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Reference</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">{debitLabel} (₹)</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">{creditLabel} (₹)</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Balance (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {/* Opening Balance */}
                                        {ledger.openingBalance !== 0 && (
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
                                                    {ledger.openingBalance.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Transactions */}
                                        {ledger.transactions.map((txn, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    {new Date(txn.date).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transactionTypeColors[txn.type] || 'bg-gray-100 text-gray-700'
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
                                                {ledger.transactions.reduce((sum, t) => sum + t.debit, 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-right text-green-600">
                                                {ledger.transactions.reduce((sum, t) => sum + t.credit, 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className={`px-4 py-2 text-sm text-right font-bold ${ledger.closingBalance > 0 ? balancePositiveColor : balanceNegativeColor
                                                }`}>
                                                {ledger.closingBalance.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
