'use client';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AddUser() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
  const toast = useToast();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [organization, setOrganization] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: {
            canCreateInvoice: true,
            canEditInvoice: true,
            canDeleteInvoice: false,
            canViewReports: true,
            canManageInventory: true,
            canManageProducts: true,
            canManageCustomers: true,
            canManageSuppliers: true,
            canManagePurchases: true,
            canManageExpenses: false,
            canManageUsers: false,
            canManageSettings: false
        }
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== 'superadmin') {
            router.push('/dashboard');
            return;
        }

        fetchOrganization();
    }, [user, authLoading, router, params.id]);

    const fetchOrganization = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/admin/organizations/${params.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrganization(response.data.organization);
        } catch (error) {
            console.error('Error fetching organization:', error);
            toast.error('Failed to load organization');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handlePermissionChange = (permission) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [permission]: !formData.permissions[permission]
            }
        });
    };

    const handleRoleChange = (role) => {
        let permissions = { ...formData.permissions };

        if (role === 'owner') {
            // Owner gets all permissions
            Object.keys(permissions).forEach(key => {
                permissions[key] = true;
            });
        } else if (role === 'manager') {
            // Manager gets most permissions except user/settings management
            permissions = {
                canCreateInvoice: true,
                canEditInvoice: true,
                canDeleteInvoice: true,
                canViewReports: true,
                canManageInventory: true,
                canManageProducts: true,
                canManageCustomers: true,
                canManageSuppliers: true,
                canManagePurchases: true,
                canManageExpenses: true,
                canManageUsers: false,
                canManageSettings: false
            };
        } else {
            // Staff gets basic permissions
            permissions = {
                canCreateInvoice: true,
                canEditInvoice: true,
                canDeleteInvoice: false,
                canViewReports: true,
                canManageInventory: true,
                canManageProducts: true,
                canManageCustomers: true,
                canManageSuppliers: true,
                canManagePurchases: true,
                canManageExpenses: false,
                canManageUsers: false,
                canManageSettings: false
            };
        }

        setFormData({
            ...formData,
            role,
            permissions
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/admin/organizations/${params.id}/users`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('User created successfully!');
            router.push(`/admin/organizations/${params.id}`);
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {organization ? `For ${organization.organizationName}` : 'Loading...'}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push(`/admin/organizations/${params.id}`)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="user@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Minimum 6 characters"
                                    minLength="6"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['owner', 'manager', 'staff'].map((role) => (
                                <label
                                    key={role}
                                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${formData.role === role
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role}
                                        checked={formData.role === role}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="flex flex-1">
                                        <div className="flex flex-col">
                                            <span className="block text-sm font-medium text-gray-900 capitalize">
                                                {role}
                                            </span>
                                            <span className="mt-1 flex items-center text-sm text-gray-500">
                                                {role === 'owner' && 'Full access to everything'}
                                                {role === 'manager' && 'Most features except user management'}
                                                {role === 'staff' && 'Basic operations only'}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Customize what this user can do (auto-set based on role)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(formData.permissions).map(([key, value]) => (
                                <label key={key} className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => handlePermissionChange(key)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => router.push(`/admin/organizations/${params.id}`)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
