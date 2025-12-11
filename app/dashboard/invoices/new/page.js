'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { productsAPI, customersAPI, invoicesAPI, shopAPI } from '@/utils/api';

export default function NewInvoice() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shopSettings, setShopSettings] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [taxType, setTaxType] = useState('CGST_SGST');
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('Cash Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    try {
      const [productsData, customersData, shopData] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll(),
        shopAPI.get(),
      ]);
      setProducts(productsData);
      setCustomers(customersData);
      setShopSettings(shopData);
      if (shopData?.defaultTaxType) {
        setTaxType(shopData.defaultTaxType);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { product: '', quantity: 1, sellingPrice: 0, gstRate: 12 },
    ]);
  };

  const removeItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;

    // Auto-fill product details
    if (field === 'product') {
      const product = products.find((p) => p._id === value);
      if (product) {
        updated[index].sellingPrice = product.sellingPrice;
        updated[index].gstRate = product.gstRate;
      }
    }

    setInvoiceItems(updated);
  };

  const handleCustomerChange = (customerId) => {
    if (customerId) {
      const customer = customers.find((c) => c._id === customerId);
      setSelectedCustomer(customer);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
    } else {
      setSelectedCustomer(null);
      setCustomerName('Cash Customer');
      setCustomerPhone('');
    }
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => {
      return sum + item.quantity * item.sellingPrice;
    }, 0);

    const totalTax = invoiceItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.sellingPrice;
      return sum + (itemTotal * item.gstRate) / 100;
    }, 0);

    const grandTotal = subtotal + totalTax - discount;
    const roundOff = Math.round(grandTotal) - grandTotal;
    const finalTotal = Math.round(grandTotal);

    return { subtotal, totalTax, grandTotal, roundOff, finalTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (invoiceItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSubmitting(true);

    try {
      const totals = calculateTotals();

      const invoiceData = {
        customer: selectedCustomer?._id,
        customerName,
        customerPhone,
        customerAddress: selectedCustomer?.address,
        customerGstin: selectedCustomer?.gstin,
        items: invoiceItems,
        taxType,
        discount,
        paymentStatus,
        paymentMethod,
        paidAmount: paymentStatus === 'PAID' ? totals.finalTotal : paidAmount,
        balanceAmount:
          paymentStatus === 'PAID' ? 0 : totals.finalTotal - paidAmount,
        paymentDetails,
        notes,
      };

      const invoice = await invoicesAPI.create(invoiceData);
      alert('Invoice created successfully!');
      router.push(`/dashboard/invoices/${invoice._id}`);
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
          <p className="mt-1 text-sm text-gray-600">Generate a new invoice for your customer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer (Optional)
                </label>
                <select
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Cash Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type *
                </label>
                <select
                  required
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CGST_SGST">CGST + SGST (Same State)</option>
                  <option value="IGST">IGST (Interstate)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <select
                      required
                      value={item.product}
                      onChange={(e) => updateItem(index, 'product', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - Stock: {product.stockQuantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="Price"
                      value={item.sellingPrice}
                      onChange={(e) => updateItem(index, 'sellingPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="w-24">
                    <select
                      required
                      value={item.gstRate}
                      onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>

                  <div className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                    ₹{(item.quantity * item.sellingPrice * (1 + item.gstRate / 100)).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {invoiceItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No items added. Click &quot;Add Item&quot; to add products to the invoice.
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {taxType === 'CGST_SGST' ? 'CGST + SGST' : 'IGST'}:
                </span>
                <span className="font-medium">₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-right"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-medium">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">₹{totals.finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  required
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    if (e.target.value === 'PAID') {
                      setPaidAmount(totals.finalTotal);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              {paymentStatus !== 'PAID' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={totals.finalTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Balance: ₹{(totals.finalTotal - paidAmount).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Details / Reference
                </label>
                <input
                  type="text"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., UPI Ref: 123456789"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || invoiceItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Invoice...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
