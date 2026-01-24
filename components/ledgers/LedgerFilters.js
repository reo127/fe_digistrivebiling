'use client';

import React from 'react';

/**
 * Reusable filter component for ledger tabs
 * Includes: Date range inputs, entity dropdown (customer/supplier/etc), and Generate button
 */
export default function LedgerFilters({
    dateRange,
    setDateRange,
    selectedId,
    setSelectedId,
    items = [],
    itemType = 'Item', // e.g., 'Customer', 'Supplier', 'Account'
    onGenerate,
    loading = false,
    placeholder = 'Select...'
}) {
    return (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 no-print border border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Select Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
                {/* Start Date */}
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

                {/* End Date */}
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

                {/* Entity Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select {itemType}
                    </label>
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="ALL">ALL</option>
                        {items.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.name} {item.phone ? `(${item.phone})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Generate Button */}
            <div className="mt-4">
                <button
                    onClick={onGenerate}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? 'Generating...' : 'Generate Ledger'}
                </button>
            </div>
        </div>
    );
}
