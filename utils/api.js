const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const authAPI = {
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  signup: (userData) => apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

export const shopAPI = {
  get: () => apiCall('/shop'),
  update: (data) => apiCall('/shop', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const productsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/products?${query}`);
  },
  getOne: (id) => apiCall(`/products/${id}`),
  create: (data) => apiCall('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/products/${id}`, {
    method: 'DELETE',
  }),
};

export const customersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/customers?${query}`);
  },
  getOne: (id) => apiCall(`/customers/${id}`),
  create: (data) => apiCall('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

export const invoicesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/invoices?${query}`);
  },
  getStats: () => apiCall('/invoices/stats'),
  getOne: (id) => apiCall(`/invoices/${id}`),
  create: (data) => apiCall('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePayment: (id, data) => apiCall(`/invoices/${id}/payment`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  // Note: Invoices cannot be edited or deleted after creation due to inventory/accounting implications
  // Use sales returns instead for corrections
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/suppliers?${query}`);
  },
  getStats: () => apiCall('/suppliers/stats'),
  getOne: (id) => apiCall(`/suppliers/${id}`),
  getLedger: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/suppliers/${id}/ledger?${query}`);
  },
  create: (data) => apiCall('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/suppliers/${id}`, {
    method: 'DELETE',
  }),
};

// Purchases API
export const purchasesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/purchases?${query}`);
  },
  getStats: () => apiCall('/purchases/stats'),
  getOne: (id) => apiCall(`/purchases/${id}`),
  create: (data) => apiCall('/purchases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePayment: (id, data) => apiCall(`/purchases/${id}/payment`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  // Note: Purchases cannot be edited or deleted after creation due to inventory/accounting implications
  // Use purchase returns instead for corrections
};

// Purchase Returns API
export const purchaseReturnsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/purchase-returns?${query}`);
  },
  getOne: (id) => apiCall(`/purchase-returns/${id}`),
  create: (data) => apiCall('/purchase-returns', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Sales Returns API
export const salesReturnsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/sales-returns?${query}`);
  },
  getOne: (id) => apiCall(`/sales-returns/${id}`),
  create: (data) => apiCall('/sales-returns', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRefund: (id, data) => apiCall(`/sales-returns/${id}/refund`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Expenses API
export const expensesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/expenses?${query}`);
  },
  getStats: () => apiCall('/expenses/stats'),
  getOne: (id) => apiCall(`/expenses/${id}`),
  create: (data) => apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

// Payments API
export const paymentsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/payments?${query}`);
  },
  getStats: () => apiCall('/payments/stats'),
  getOne: (id) => apiCall(`/payments/${id}`),
  create: (data) => apiCall('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Inventory API
export const inventoryAPI = {
  getBatchesByProduct: (productId) => apiCall(`/inventory/batches/product/${productId}`),
  getBatch: (id) => apiCall(`/inventory/batches/${id}`),
  updateBatch: (id, data) => apiCall(`/inventory/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getNearExpiry: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/inventory/alerts/near-expiry?${query}`);
  },
  getExpired: () => apiCall('/inventory/alerts/expired'),
  getLowStock: () => apiCall('/inventory/alerts/low-stock'),
  getStats: () => apiCall('/inventory/stats'),
  getValuation: () => apiCall('/inventory/valuation'),
};

// Reports API
export const reportsAPI = {
  // GSTR-1
  getGSTR1: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/gstr1?${query}`);
  },
  downloadGSTR1: (params = {}) => {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams(params).toString();
    window.open(`${API_URL}/reports/gstr1?${query}&token=${token}`, '_blank');
  },

  // GSTR-3B
  getGSTR3B: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/gstr3b?${query}`);
  },

  // Tax Summary
  getTaxSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/tax-summary?${query}`);
  },

  // HSN Summary
  getHSNSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/hsn-summary?${query}`);
  },

  // P&L
  getProfitLoss: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/profit-loss?${query}`);
  },

  // Balance Sheet
  getBalanceSheet: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/balance-sheet?${query}`);
  },

  // E-Way Bill
  getEWayBill: (invoiceId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/eway-bill/${invoiceId}?${query}`);
  },
  getEWayBillBulk: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/eway-bill-bulk?${query}`);
  },

  // Ledger
  getLedger: (account, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/ledger/${account}?${query}`);
  },

  // Trial Balance
  getTrialBalance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/trial-balance?${query}`);
  },

  // Summary
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/summary?${query}`);
  },
};
