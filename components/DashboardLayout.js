'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { shopAPI } from '@/utils/api';
import { APP_CONFIG } from '@/config/appConfig';
import {
  HiHome,
  HiDocumentAdd,
  HiDocumentText,
  HiCube,
  HiUsers,
  HiCog,
  HiMenu,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiLogout,
  HiShoppingCart,
  HiReceiptRefund,
  HiTruck,
  HiUserGroup,
  HiViewGrid,
  HiCurrencyRupee,
  HiChartBar
} from 'react-icons/hi';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HiHome },
  { name: 'New Invoice', href: '/dashboard/invoices/new', icon: HiDocumentAdd },
  { name: 'Invoices', href: '/dashboard/invoices', icon: HiDocumentText },
  { name: 'Sales Returns', href: '/dashboard/sales-returns', icon: HiReceiptRefund },
  { name: 'Purchases', href: '/dashboard/purchases', icon: HiShoppingCart },
  { name: 'Purchase Returns', href: '/dashboard/purchase-returns', icon: HiReceiptRefund },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: HiTruck },
  { name: 'Inventory', href: '/dashboard/inventory', icon: HiViewGrid },
  { name: 'Products', href: '/dashboard/products', icon: HiCube },
  { name: 'Customers', href: '/dashboard/customers', icon: HiUsers },
  { name: 'Expenses', href: '/dashboard/expenses', icon: HiCurrencyRupee },
  { name: 'Reports', href: '/dashboard/reports', icon: HiChartBar },
  { name: 'Settings', href: '/dashboard/settings', icon: HiCog },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [shopSettings, setShopSettings] = useState(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const loadShopSettings = async () => {
      try {
        const data = await shopAPI.get();
        setShopSettings(data);
      } catch (error) {
        console.error('Error loading shop settings:', error);
      }
    };
    loadShopSettings();
  }, []);

  const shopName = shopSettings?.shopName || APP_CONFIG.shopName;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-xl">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between h-16 px-6 bg-emerald-600 relative overflow-hidden">
            {!collapsed && (
              <h1 className="text-2xl font-bold text-white relative z-10 tracking-tight">
                {shopName}<span className="text-emerald-200">.</span>
              </h1>
            )}
            {collapsed && (
              <h1 className="text-2xl font-bold text-white relative z-10">{shopName?.[0]?.toUpperCase() || 'B'}</h1>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="relative z-10 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <HiChevronRight className="w-5 h-5" />
              ) : (
                <HiChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const exactMatch = navigation.find(nav => nav.href === pathname);
              const isActive = exactMatch
                ? pathname === item.href
                : (pathname === item.href ||
                   (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')));

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className={`flex-shrink-0 relative z-10 ${
                    collapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'
                  } ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'}`} />
                  {!collapsed && (
                    <span className="relative z-10 truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/30">
            {!collapsed ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 group"
                >
                  <HiLogout className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200"
                  title="Logout"
                >
                  <HiLogout className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-80 h-full bg-white shadow-2xl transform transition-transform duration-300">
            <div className="flex items-center justify-between h-16 px-6 bg-emerald-600">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {shopName}<span className="text-emerald-200">.</span>
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const exactMatch = navigation.find(nav => nav.href === pathname);
                const isActive = exactMatch
                  ? pathname === item.href
                  : (pathname === item.href ||
                     (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'
                    }`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/30">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                >
                  <HiLogout className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm lg:hidden px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <HiMenu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-emerald-600">
            {shopName}
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
