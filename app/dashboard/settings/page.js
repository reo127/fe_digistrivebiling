'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { shopAPI } from '@/utils/api';
import {
  HiCog,
  HiCheckCircle,
  HiExclamationCircle,
  HiSave,
  HiOfficeBuilding,
  HiUser,
  HiPhone,
  HiMail,
  HiLocationMarker,
  HiDocument
} from 'react-icons/hi';

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    drugLicense: '',
    defaultTaxType: 'CGST_SGST',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadSettings();
    }
  }, [user, loading, router]);

  const loadSettings = async () => {
    try {
      const data = await shopAPI.get();
      if (data) {
        setFormData({
          shopName: data.shopName || '',
          ownerName: data.ownerName || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          phone: data.phone || '',
          email: data.email || '',
          gstin: data.gstin || '',
          drugLicense: data.drugLicense || '',
          defaultTaxType: data.defaultTaxType || 'CGST_SGST',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await shopAPI.update(formData);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/50">
              <HiCog className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shop Settings</h1>
              <p className="mt-1 text-sm text-gray-600">Configure your shop details and preferences</p>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border-l-4 flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500'
            }`}
          >
            {message.type === 'success' ? (
              <HiCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <HiExclamationCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <HiOfficeBuilding className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Shop Name *</label>
                <input
                  type="text"
                  name="shopName"
                  required
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="ABC Medical Store"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Owner Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Phone *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="shop@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <HiLocationMarker className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Address Details</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="123, Main Street"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Mumbai"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="400001"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Tax & Legal Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
              <HiDocument className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Tax & Legal Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">GSTIN *</label>
                <input
                  type="text"
                  name="gstin"
                  required
                  value={formData.gstin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all uppercase"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Drug License No.</label>
                <input
                  type="text"
                  name="drugLicense"
                  value={formData.drugLicense}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="DL-123456"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Default Tax Type</label>
                <select
                  name="defaultTaxType"
                  value={formData.defaultTaxType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="CGST_SGST">CGST + SGST (Same State)</option>
                  <option value="IGST">IGST (Different State)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This will be the default tax type for new invoices
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-lg shadow-orange-500/50 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <HiSave className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
