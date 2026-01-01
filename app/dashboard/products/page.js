'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import DashboardLayout from '@/components/DashboardLayout';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { productsAPI } from '@/utils/api';
import {
  HiPlus,
  HiSearch,
  HiPencil,
  HiTrash,
  HiX,
  HiCube,
  HiExclamation
} from 'react-icons/hi';

export default function Products() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    hsnCode: '',
    gstRate: 12,
    mrp: '',
    sellingPrice: '',
    purchasePrice: '',
    stockQuantity: '',
    unit: 'PCS',
    batchNo: '',          // For initial batch
    batchExpiryDate: '',  // For initial batch expiry
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadProducts();
    }
  }, [user, loading, router]);

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll({ search: searchTerm });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Product Name is mandatory
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Product Name is required';
    }

    // MRP is mandatory
    if (!formData.mrp || formData.mrp === '' || parseFloat(formData.mrp) <= 0) {
      newErrors.mrp = 'MRP is required and must be greater than 0';
    }

    // Selling Price is mandatory
    if (!formData.sellingPrice || formData.sellingPrice === '' || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Selling Price is required and must be greater than 0';
    }

    // Purchase Price is mandatory
    if (!formData.purchasePrice || formData.purchasePrice === '' || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Purchase Price is required and must be greater than 0';
    }

    // Stock Quantity is mandatory
    if (formData.stockQuantity === '' || parseFloat(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Stock Quantity is required and cannot be negative';
    }

    // Batch Number is optional - will be auto-generated if not provided

    // Batch Expiry Date is mandatory if stock quantity > 0
    if (parseFloat(formData.stockQuantity) > 0 && (!formData.batchExpiryDate || formData.batchExpiryDate === '')) {
      newErrors.batchExpiryDate = 'Batch Expiry Date is required when adding stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editingProduct) {
        // When editing, don't send batch fields
        const { batchNo, batchExpiryDate, ...updateData } = formData;
        await productsAPI.update(editingProduct._id, updateData);
        toast.success('Product updated successfully!');
      } else {
        // When creating new product, send batch fields as batchNo and expiryDate
        const submitData = {
          ...formData,
          expiryDate: formData.batchExpiryDate // Backend expects 'expiryDate' for batch
        };
        // Remove batchExpiryDate since we renamed it to expiryDate
        delete submitData.batchExpiryDate;

        await productsAPI.create(submitData);
        toast.success('Product added successfully!');
      }
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      hsnCode: product.hsnCode || '',
      gstRate: product.gstRate,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice || '',
      stockQuantity: product.stockQuantity,
      unit: product.unit,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        loadProducts();
      } catch (error) {
        toast.error(error.message || 'An error occurred');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      expiryDate: '',
      hsnCode: '',
      gstRate: 12,
      mrp: '',
      sellingPrice: '',
      purchasePrice: '',
      stockQuantity: '',
      unit: 'PCS',
      batchNo: '',
      batchExpiryDate: '',
    });
    setEditingProduct(null);
    setErrors({});
  };

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/50">
                <HiCube className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="mt-1 text-sm text-gray-600">Manage your medicine inventory</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/50 hover:shadow-xl transition-all duration-200"
          >
            <HiPlus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Search */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="relative">
              <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or HSN code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={() => loadProducts()}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              />
            </div>
          </div>

          {/* Table */}
          {loadingProducts ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={7} />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Batch/Expiry
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    MRP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    GST
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <HiCube className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No products found</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first product to get started!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="font-medium">{product.batchNo || '-'}</div>
                          {product.expiryDate && (
                            <div className="text-xs text-gray-500">
                              Exp: {new Date(product.expiryDate).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            product.stockQuantity === 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {product.stockQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.mrp.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                          {product.gstRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                        >
                          <HiPencil className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="inline-flex items-center px-3 py-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                        >
                          <HiTrash className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-900/75 backdrop-blur-sm" onClick={() => setShowModal(false)} />

            <div className="relative z-50 inline-block w-full max-w-4xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                    <HiCube className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) {
                          setErrors({ ...errors, name: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        errors.name
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <HiExclamation className="w-4 h-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">HSN Code</label>
                    <input
                      type="text"
                      value={formData.hsnCode}
                      onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter HSN code"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">GST Rate (%)</label>
                    <select
                      value={formData.gstRate}
                      onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      MRP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.mrp}
                      onChange={(e) => {
                        setFormData({ ...formData, mrp: e.target.value });
                        if (errors.mrp) {
                          setErrors({ ...errors, mrp: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        errors.mrp
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.mrp && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <HiExclamation className="w-4 h-4 mr-1" />
                        {errors.mrp}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => {
                        setFormData({ ...formData, sellingPrice: e.target.value });
                        if (errors.sellingPrice) {
                          setErrors({ ...errors, sellingPrice: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        errors.sellingPrice
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.sellingPrice && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <HiExclamation className="w-4 h-4 mr-1" />
                        {errors.sellingPrice}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => {
                        setFormData({ ...formData, purchasePrice: e.target.value });
                        if (errors.purchasePrice) {
                          setErrors({ ...errors, purchasePrice: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        errors.purchasePrice
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.purchasePrice && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <HiExclamation className="w-4 h-4 mr-1" />
                        {errors.purchasePrice}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => {
                        setFormData({ ...formData, stockQuantity: e.target.value });
                        if (errors.stockQuantity) {
                          setErrors({ ...errors, stockQuantity: '' });
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        errors.stockQuantity
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      placeholder="0"
                    />
                    {errors.stockQuantity && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <HiExclamation className="w-4 h-4 mr-1" />
                        {errors.stockQuantity}
                      </p>
                    )}
                  </div>

                  {/* Batch fields - only show when adding initial stock (new product only) */}
                  {!editingProduct && formData.stockQuantity && parseFloat(formData.stockQuantity) > 0 && (
                    <>
                      <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <HiExclamation className="w-5 h-5 text-blue-600 mt-0.5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-900">Batch Details</h4>
                            <p className="text-xs text-blue-700 mt-1">
                              Batch number will be auto-generated if left empty. Expiry date is mandatory for tracking purposes.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Batch Number <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.batchNo}
                          onChange={(e) => {
                            setFormData({ ...formData, batchNo: e.target.value });
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Auto-generated if left empty"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Batch Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.batchExpiryDate}
                          onChange={(e) => {
                            setFormData({ ...formData, batchExpiryDate: e.target.value });
                            if (errors.batchExpiryDate) {
                              setErrors({ ...errors, batchExpiryDate: '' });
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                            errors.batchExpiryDate
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                          }`}
                        />
                        {errors.batchExpiryDate && (
                          <p className="text-sm text-red-600 flex items-center mt-1">
                            <HiExclamation className="w-4 h-4 mr-1" />
                            {errors.batchExpiryDate}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="PCS">PCS</option>
                      <option value="BOX">BOX</option>
                      <option value="STRIP">STRIP</option>
                      <option value="BOTTLE">BOTTLE</option>
                      <option value="KG">KG</option>
                      <option value="LITRE">LITRE</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-700 font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/50 transition-all"
                  >
                    {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
