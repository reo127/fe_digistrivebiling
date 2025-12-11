'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { invoicesAPI } from '@/utils/api';
import Link from 'next/link';
import {
  HiCurrencyRupee,
  HiClock,
  HiDocumentText,
  HiTrendingUp,
  HiDocumentAdd,
  HiCube,
  HiUsers,
  HiCog,
  HiArrowRight,
  HiCheckCircle
} from 'react-icons/hi';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await invoicesAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome header */}
        <div className="relative bg-emerald-600 rounded-3xl p-8 text-white overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center">
                  Welcome back, {user.name}!
                  <span className="ml-3 animate-bounce">👋</span>
                </h1>
                <p className="text-emerald-100 text-lg">Here&apos;s what&apos;s happening with your store today.</p>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <HiCheckCircle className="w-5 h-5 text-green-300" />
                <span className="text-sm font-medium">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Today's Sales */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/50">
                  <HiCurrencyRupee className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center text-green-600 text-sm font-semibold bg-green-100 px-3 py-1 rounded-full">
                  <HiTrendingUp className="w-4 h-4 mr-1" />
                  Today
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Today&apos;s Sales</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <span className="text-gray-400 animate-pulse">...</span>
                ) : (
                  `₹${stats?.todaySales?.toLocaleString('en-IN') || '0'}`
                )}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Revenue generated today</p>
              </div>
            </div>
          </div>

          {/* Outstanding Amount */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50">
                  <HiClock className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center text-orange-600 text-sm font-semibold bg-orange-100 px-3 py-1 rounded-full">
                  Pending
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Outstanding Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <span className="text-gray-400 animate-pulse">...</span>
                ) : (
                  `₹${stats?.totalOutstanding?.toLocaleString('en-IN') || '0'}`
                )}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Amount to be collected</p>
              </div>
            </div>
          </div>

          {/* Total Invoices */}
          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/50">
                  <HiDocumentText className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center text-blue-600 text-sm font-semibold bg-blue-100 px-3 py-1 rounded-full">
                  Total
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <span className="text-gray-400 animate-pulse">...</span>
                ) : (
                  stats?.totalInvoices?.toLocaleString('en-IN') || '0'
                )}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Invoices generated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <div className="h-1 flex-1 ml-6 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link
              href="/dashboard/invoices/new"
              className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl hover:from-emerald-100 hover:to-green-100 transition-all duration-300 border-2 border-transparent hover:border-emerald-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-green-600/0 group-hover:from-emerald-600/5 group-hover:to-green-600/5 transition-all duration-300"></div>
              <div className="relative z-10 p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300 mb-4">
                <HiDocumentAdd className="w-8 h-8 text-white" />
              </div>
              <span className="relative z-10 text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">New Invoice</span>
              <HiArrowRight className="relative z-10 w-4 h-4 text-emerald-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/dashboard/products"
              className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border-2 border-transparent hover:border-green-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-emerald-600/0 group-hover:from-green-600/5 group-hover:to-emerald-600/5 transition-all duration-300"></div>
              <div className="relative z-10 p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/50 group-hover:scale-110 transition-transform duration-300 mb-4">
                <HiCube className="w-8 h-8 text-white" />
              </div>
              <span className="relative z-10 text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">Products</span>
              <HiArrowRight className="relative z-10 w-4 h-4 text-green-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/dashboard/customers"
              className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all duration-300"></div>
              <div className="relative z-10 p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform duration-300 mb-4">
                <HiUsers className="w-8 h-8 text-white" />
              </div>
              <span className="relative z-10 text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Customers</span>
              <HiArrowRight className="relative z-10 w-4 h-4 text-purple-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/dashboard/settings"
              className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl hover:from-orange-100 hover:to-red-100 transition-all duration-300 border-2 border-transparent hover:border-orange-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-red-600/0 group-hover:from-orange-600/5 group-hover:to-red-600/5 transition-all duration-300"></div>
              <div className="relative z-10 p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform duration-300 mb-4">
                <HiCog className="w-8 h-8 text-white" />
              </div>
              <span className="relative z-10 text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">Settings</span>
              <HiArrowRight className="relative z-10 w-4 h-4 text-orange-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
