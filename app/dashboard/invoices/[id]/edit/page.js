'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { HiExclamationCircle, HiArrowLeft } from 'react-icons/hi';

export default function EditInvoice() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <HiExclamationCircle className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Invoices Cannot Be Edited
              </h3>
              <div className="text-yellow-700 space-y-3">
                <p>
                  For accounting and inventory compliance, invoices cannot be modified after creation.
                </p>

                <div className="bg-white bg-opacity-50 p-4 rounded-md">
                  <p className="font-medium mb-2">Why?</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Invoices affect stock levels (inventory tracking)</li>
                    <li>They create accounting ledger entries</li>
                    <li>GST compliance requires immutable tax documents</li>
                    <li>Audit trail must remain intact</li>
                  </ul>
                </div>

                <div className="bg-blue-50 bg-opacity-70 p-4 rounded-md border border-blue-200">
                  <p className="font-medium text-blue-900 mb-2">✅ What You Can Do:</p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>
                      <strong>Update Payment Status:</strong> Mark invoice as paid/unpaid
                    </li>
                    <li>
                      <strong>Create Sales Return:</strong> If you need to correct/reverse an invoice
                    </li>
                    <li>
                      <strong>Create New Invoice:</strong> For additional sales
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/invoices/${params.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <HiArrowLeft className="w-4 h-4" />
                  View Invoice
                </button>
                <button
                  onClick={() => router.push('/dashboard/sales-returns/new')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Sales Return
                </button>
                <button
                  onClick={() => router.push('/dashboard/invoices')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  All Invoices
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Standard Practice</h4>
          <p className="text-gray-600 text-sm mb-3">
            This is how all professional accounting systems work:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">QuickBooks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">Tally</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">SAP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">Zoho Books</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3 italic">
            All prevent editing of posted invoices to maintain data integrity.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
