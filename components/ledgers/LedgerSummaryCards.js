'use client';

import React from 'react';

/**
 * Reusable summary cards component for ledger tabs
 * Displays 3 cards with customizable labels, values, and colors
 */
export default function LedgerSummaryCards({ cards = [] }) {
    if (!cards || cards.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print mb-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`border rounded-lg p-4 ${card.bgColor || 'bg-gray-50'} ${card.borderColor || 'border-gray-200'}`}
                >
                    <p className={`text-sm font-medium ${card.labelColor || 'text-gray-600'}`}>
                        {card.label}
                    </p>
                    <p className={`text-2xl font-bold ${card.valueColor || 'text-gray-900'}`}>
                        {card.prefix || ''}{card.value}{card.suffix || ''}
                    </p>
                </div>
            ))}
        </div>
    );
}

/**
 * Helper function to create card configurations
 * Usage example:
 * 
 * const cards = [
 *   createCard('Total Customers', ledgerData.length, 'blue'),
 *   createCard('Total Invoices', invoiceCount, 'green'),
 *   createCard('Total Outstanding', totalOutstanding, 'red', '₹')
 * ];
 */
export function createCard(label, value, colorTheme = 'gray', prefix = '', suffix = '') {
    const themes = {
        blue: {
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            labelColor: 'text-blue-600',
            valueColor: 'text-blue-900'
        },
        green: {
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            labelColor: 'text-green-600',
            valueColor: 'text-green-900'
        },
        red: {
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            labelColor: 'text-red-600',
            valueColor: 'text-red-900'
        },
        orange: {
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            labelColor: 'text-orange-600',
            valueColor: 'text-orange-900'
        },
        gray: {
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            labelColor: 'text-gray-600',
            valueColor: 'text-gray-900'
        }
    };

    const theme = themes[colorTheme] || themes.gray;

    return {
        label,
        value,
        prefix,
        suffix,
        ...theme
    };
}
