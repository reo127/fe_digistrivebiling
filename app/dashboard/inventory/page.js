'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageLoader from '@/components/PageLoader';
import { inventoryAPI, productsAPI } from '@/utils/api';
import { HiSearch, HiExclamationCircle, HiClock, HiBan } from 'react-icons/hi';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [allBatches, setAllBatches] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [nearExpiryBatches, setNearExpiryBatches] = useState([]);
  const [expiredBatches, setExpiredBatches] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, lowStock, nearExpiry, expired] = await Promise.all([
        inventoryAPI.getStats(),
        inventoryAPI.getLowStock(),
        inventoryAPI.getNearExpiry({ months: 3 }),
        inventoryAPI.getExpired()
      ]);

      setStats(statsData);
      setLowStockItems(lowStock);
      setNearExpiryBatches(nearExpiry);
      setExpiredBatches(expired);

      // Combine all batches for "All Stock" tab
      const allProducts = await productsAPI.getAll();
      const batchesWithProducts = [];

      for (const product of allProducts) {
        const batches = await inventoryAPI.getBatchesByProduct(product._id);
        batches.forEach(batch => {
          batchesWithProducts.push({
            ...batch,
            productInfo: product
          });
        });
      }
      setAllBatches(batchesWithProducts);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTabData = () => {
    switch (activeTab) {
      case 'all':
        return allBatches.filter(batch =>
          batch.productInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
          batch.batchNo?.toLowerCase().includes(search.toLowerCase())
        );
      case 'low-stock':
        return lowStockItems.filter(item =>
          item.name?.toLowerCase().includes(search.toLowerCase())
        );
      case 'near-expiry':
        return nearExpiryBatches.filter(batch =>
          batch.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          batch.batchNo?.toLowerCase().includes(search.toLowerCase())
        );
      case 'expired':
        return expiredBatches.filter(batch =>
          batch.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          batch.batchNo?.toLowerCase().includes(search.toLowerCase())
        );
      default:
        return [];
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysToExpiry < 0) {
      return { color: 'text-red-600 bg-red-100', label: 'Expired', days: Math.abs(daysToExpiry) };
    } else if (daysToExpiry <= 30) {
      return { color: 'text-red-600 bg-red-50', label: `${daysToExpiry} days`, days: daysToExpiry };
    } else if (daysToExpiry <= 90) {
      return { color: 'text-orange-600 bg-orange-50', label: `${daysToExpiry} days`, days: daysToExpiry };
    } else {
      return { color: 'text-green-600 bg-green-50', label: `${daysToExpiry} days`, days: daysToExpiry };
    }
  };

  const tabData = getTabData();

  if (loading) {
    return <PageLoader text="Loading inventory..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Track stock levels, batches, and expiry dates</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Products</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Stock Value</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                ₹{stats.totalValue?.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <HiExclamationCircle className="w-4 h-4" />
                Low Stock Items
              </div>
              <div className="text-3xl font-bold text-orange-600 mt-2">{stats.lowStockCount}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <HiClock className="w-4 h-4" />
                Near Expiry / Expired
              </div>
              <div className="text-3xl font-bold text-red-600 mt-2">
                {stats.nearExpiryCount + stats.expiredCount}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'all'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Stock
              </button>
              <button
                onClick={() => setActiveTab('low-stock')}
                className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  activeTab === 'low-stock'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HiExclamationCircle className="w-4 h-4" />
                Low Stock ({lowStockItems.length})
              </button>
              <button
                onClick={() => setActiveTab('near-expiry')}
                className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  activeTab === 'near-expiry'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HiClock className="w-4 h-4" />
                Near Expiry ({nearExpiryBatches.length})
              </button>
              <button
                onClick={() => setActiveTab('expired')}
                className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  activeTab === 'expired'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HiBan className="w-4 h-4" />
                Expired ({expiredBatches.length})
              </button>
            </nav>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <HiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name or batch number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {activeTab === 'low-stock' ? (
              // Low Stock Table
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minimum Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tabData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No low stock items found.
                      </td>
                    </tr>
                  ) : (
                    tabData.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.genericName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-orange-600">{item.currentStock}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.minStockLevel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Low Stock
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              // All Stock / Near Expiry / Expired Table
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tabData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No batches found.
                      </td>
                    </tr>
                  ) : (
                    tabData.map((batch) => {
                      const expiryStatus = getExpiryStatus(batch.expiryDate);
                      const product = batch.productInfo || batch.product;

                      return (
                        <tr key={batch._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{product?.name}</div>
                            <div className="text-sm text-gray-500">{product?.genericName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                            {batch.batchNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(batch.expiryDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-semibold ${batch.quantity <= 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                              {batch.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{batch.purchasePrice?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{batch.sellingPrice?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
