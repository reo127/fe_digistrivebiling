'use client';
// GST Reports Page
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { HiDownload, HiDocumentReport } from 'react-icons/hi';
import { reportsAPI, shopAPI } from '@/utils/api';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('gstr1');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [shopName, setShopName] = useState('Billing Software');
  const [shopSettings, setShopSettings] = useState(null);

  // Fetch shop settings and update page title
  useEffect(() => {
    const loadShopSettings = async () => {
      try {
        const settings = await shopAPI.get();
        setShopSettings(settings);
        if (settings && settings.shopName) {
          const appTitle = `${settings.shopName} - Billing Software`;
          setShopName(settings.shopName);
          // Update browser page title dynamically
          document.title = appTitle;
        }
      } catch (error) {
        console.error('Error loading shop settings:', error);
      }
    };
    loadShopSettings();
  }, []);

  const tabs = [
    { id: 'gstr1', name: 'GSTR-1', description: 'Outward Supplies' },
    { id: 'gstr3b', name: 'GSTR-3B', description: 'Summary Return' },
    { id: 'taxSummary', name: 'Tax Summary', description: 'GST Breakdown' },
    { id: 'hsnSummary', name: 'HSN Summary', description: 'HSN-wise Summary' }
  ];

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      let data;
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      switch (activeTab) {
        case 'gstr1':
          data = await reportsAPI.getGSTR1(params);
          break;
        case 'gstr3b':
          data = await reportsAPI.getGSTR3B(params);
          break;
        case 'taxSummary':
          data = await reportsAPI.getTaxSummary(params);
          break;
        case 'hsnSummary':
          data = await reportsAPI.getHSNSummary(params);
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!reportData) {
      alert('Please generate a report first');
      return;
    }

    if (format === 'pdf') {
      alert(`⚠️ IMPORTANT - To remove the date/time header:\n\n1. In the print dialog that opens, click "More settings"\n2. Turn OFF the "Headers and footers" option\n3. Set margins to "Default" or "None"\n4. Click "Save" to download PDF\n\n❌ Without doing this, you will see browser headers like:\n"14/12/2025, 02:38 ${shopName} - Billing Software"\n\n✅ After turning off headers, you will get a clean PDF`);
      window.print();
      return;
    }

    if (format === 'excel') {
      exportToExcel();
    }

    if (format === 'json') {
      exportToJSON();
    }
  };

  const exportToJSON = () => {
    const reportName = tabs.find(t => t.id === activeTab)?.name || 'Report';
    const dateStr = `${dateRange.startDate}_to_${dateRange.endDate}`;

    const jsonData = {
      reportType: reportName,
      reportId: activeTab,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      data: reportData
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName}_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const reportName = tabs.find(t => t.id === activeTab)?.name || 'Report';
    const dateStr = `${dateRange.startDate}_to_${dateRange.endDate}`;

    if (activeTab === 'gstr1') {
      // Get period formatted
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      const periodStr = `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

      // Main GSTR1 Report Sheet
      const gstr1Data = [
        ['Period', periodStr, '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['1. GSTIN', shopSettings?.gstin || '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2.a Legal name of the registered person.', shopSettings?.shopName || '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['2.b Trade name, if any', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['3.a Aggregate turnover of the preceeding Financial Year', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['3.b Aggregate turnover, April to June 2017', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['GSTIN/UIN', 'Party Name', 'Transaction Type', 'Invoice No.', 'Invoice Date', 'Invoice Value', 'Rate', 'Cess Rate', 'Taxable value', 'Reverse Charge', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount', 'Place of Supply(Name of state)'],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
      ];

      // Add invoice data rows
      let totalInvoiceValue = 0;
      let totalTaxableValue = 0;
      let totalIGST = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalCess = 0;

      // Combine all invoices (B2B and B2C)
      const allInvoices = [...(reportData.b2bInvoices || []), ...(reportData.b2cSmallInvoices || []), ...(reportData.b2cLargeInvoices || [])];

      allInvoices.forEach(inv => {
        const invoiceDate = new Date(inv.invoiceDate);
        const formattedDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;

        gstr1Data.push([
          inv.gstin || '',
          inv.customerName || '',
          'Sale',
          inv.invoiceNumber || '',
          formattedDate,
          inv.invoiceValue || 0,
          inv.gstRate || 0,
          inv.cessRate || 0,
          inv.taxableValue || 0,
          'N',
          inv.igst || 0,
          inv.cgst || 0,
          inv.sgst || 0,
          inv.cessAmount || 0,
          inv.placeOfSupply || ''
        ]);

        totalInvoiceValue += inv.invoiceValue || 0;
        totalTaxableValue += inv.taxableValue || 0;
        totalIGST += inv.igst || 0;
        totalCGST += inv.cgst || 0;
        totalSGST += inv.sgst || 0;
        totalCess += inv.cessAmount || 0;
      });

      // Add totals row
      gstr1Data.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      gstr1Data.push(['Total', '', '', '', '', totalInvoiceValue, '', '', totalTaxableValue, '', totalIGST, totalCGST, totalSGST, totalCess, '']);

      const gstr1WS = XLSX.utils.aoa_to_sheet(gstr1Data);
      XLSX.utils.book_append_sheet(workbook, gstr1WS, 'GSTR1 Report');

      // B2B, SEZ, DE Sheet
      const b2bSummaryData = [
        ['Summary For B2B, SEZ, DE (4A, 4B, 6B, 6C)', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['No. of Recipients', '', 'No. of Invoices', '', 'Total Invoice Value', '', '', '', '', '', '', 'Total Taxable Value', 'Total Cess'],
        [reportData.summary?.b2bCount || 0, '', (reportData.b2bInvoices || []).length, '', totalInvoiceValue, '', '', '', '', '', '', totalTaxableValue, totalCess],
        ['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Applicable % of Tax Rate', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount']
      ];

      (reportData.b2bInvoices || []).forEach(inv => {
        const invoiceDate = new Date(inv.invoiceDate);
        const formattedDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;
        b2bSummaryData.push([
          inv.gstin || '',
          inv.customerName || '',
          inv.invoiceNumber || '',
          formattedDate,
          inv.invoiceValue || 0,
          inv.placeOfSupply || '',
          'N',
          '',
          'Regular',
          '',
          inv.gstRate || 0,
          inv.taxableValue || 0,
          inv.cessAmount || 0
        ]);
      });

      const b2bWS = XLSX.utils.aoa_to_sheet(b2bSummaryData);
      XLSX.utils.book_append_sheet(workbook, b2bWS, 'b2b,sez,de');

      // B2CL Sheet
      const b2clData = [
        ['Summary For B2CL(5)', '', '', '', '', '', '', '', ''],
        ['No. of Invoices', '', 'Total Invoice Value', '', '', '', 'Total Taxable Value', 'Total Cess', ''],
        [(reportData.b2cLargeInvoices || []).length, '', reportData.summary?.b2cLargeValue || 0, '', '', '', reportData.summary?.b2cLargeTaxable || 0, 0, ''],
        ['Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN']
      ];

      (reportData.b2cLargeInvoices || []).forEach(inv => {
        const invoiceDate = new Date(inv.invoiceDate);
        const formattedDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;
        b2clData.push([
          inv.invoiceNumber || '',
          formattedDate,
          inv.invoiceValue || 0,
          inv.placeOfSupply || '',
          '',
          inv.gstRate || 0,
          inv.taxableValue || 0,
          inv.cessAmount || 0,
          ''
        ]);
      });

      const b2clWS = XLSX.utils.aoa_to_sheet(b2clData);
      XLSX.utils.book_append_sheet(workbook, b2clWS, 'b2cl');

      // B2CS Sheet - Group by rate and place of supply
      const b2csGrouped = {};
      (reportData.b2cSmallInvoices || []).forEach(inv => {
        const key = `${inv.gstRate || 0}_${inv.placeOfSupply || ''}`;
        if (!b2csGrouped[key]) {
          b2csGrouped[key] = {
            rate: inv.gstRate || 0,
            placeOfSupply: inv.placeOfSupply || '',
            taxableValue: 0,
            cessAmount: 0
          };
        }
        b2csGrouped[key].taxableValue += inv.taxableValue || 0;
        b2csGrouped[key].cessAmount += inv.cessAmount || 0;
      });

      const b2csTotalTaxable = Object.values(b2csGrouped).reduce((sum, item) => sum + item.taxableValue, 0);
      const b2csTotalCess = Object.values(b2csGrouped).reduce((sum, item) => sum + item.cessAmount, 0);

      const b2csData = [
        ['Summary For B2CS(7)', '', '', '', '', '', '', '', ''],
        ['', '', '', '', 'Total Taxable Value', 'Total Cess', '', '', ''],
        ['', '', '', '', b2csTotalTaxable, b2csTotalCess, '', '', ''],
        ['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN', '', '']
      ];

      Object.values(b2csGrouped).forEach(item => {
        b2csData.push([
          'OE',
          item.placeOfSupply,
          '',
          item.rate,
          item.taxableValue,
          item.cessAmount,
          '',
          '',
          ''
        ]);
      });

      const b2csWS = XLSX.utils.aoa_to_sheet(b2csData);
      XLSX.utils.book_append_sheet(workbook, b2csWS, 'b2cs');

      // Exempt Sheet
      const exempData = [
        ['Summary For Nil rated, exempted and non GST outward supplies (8)', '', '', ''],
        ['', 'Total Nil Rated Supplies', 'Total Exempted Supplies', 'Total Non-GST Supplies'],
        ['', 0, 0, 0],
        ['Description', 'Nil Rated Supplies', 'Exempted(other than nil rated/non GST supply)', 'Non-GST Supplies'],
        ['Inter-State supplies to registered persons', 0, 0, 0],
        ['Intra-State supplies to registered persons', 0, 0, 0],
        ['Inter-State supplies to unregistered persons', 0, 0, 0],
        ['Intra-State supplies to unregistered persons', 0, 0, 0]
      ];

      const exempWS = XLSX.utils.aoa_to_sheet(exempData);
      XLSX.utils.book_append_sheet(workbook, exempWS, 'exemp');

      // HSN(B2B) Sheet
      const hsnb2bData = [
        ['Summary For HSN(12)', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['No. of HSN', '', '', '', 'Total Value', '', 'Total Taxable Value', 'Total Integrated Tax', 'Total Central Tax', 'Total State/UT Tax', 'Total Cess', '', '', ''],
        [0, '', '', '', 0, '', 0, 0, 0, 0, 0, '', '', ''],
        ['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Rate', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount', '', '', '']
      ];

      const hsnb2bWS = XLSX.utils.aoa_to_sheet(hsnb2bData);
      XLSX.utils.book_append_sheet(workbook, hsnb2bWS, 'hsn(b2b)');

      // HSN(B2C) Sheet - This should contain grouped HSN data
      const hsnb2cWS = XLSX.utils.aoa_to_sheet(hsnb2bData); // Similar structure
      XLSX.utils.book_append_sheet(workbook, hsnb2cWS, 'hsn(b2c)');

      // Item Summary Sheet
      const itemSummaryWS = XLSX.utils.aoa_to_sheet(hsnb2bData); // Similar structure
      XLSX.utils.book_append_sheet(workbook, itemSummaryWS, 'itemSummary');

      // Docs Sheet
      const firstInvoice = allInvoices.length > 0 ? allInvoices[0].invoiceNumber : '';
      const lastInvoice = allInvoices.length > 0 ? allInvoices[allInvoices.length - 1].invoiceNumber : '';

      const docsData = [
        ['Summary of documents issued during the tax period (13)', '', '', '', ''],
        ['', '', '', 'Total Number', 'Total Cancelled'],
        ['', '', '', allInvoices.length, '0'],
        ['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled'],
        ['Invoices for outward supply', firstInvoice, lastInvoice, allInvoices.length.toString(), '0']
      ];

      const docsWS = XLSX.utils.aoa_to_sheet(docsData);
      XLSX.utils.book_append_sheet(workbook, docsWS, 'docs');
    }
    else if (activeTab === 'gstr3b') {
      const gstr3bData = [
        ['GSTR-3B Report'],
        ['Period', `${dateRange.startDate} to ${dateRange.endDate}`],
        [''],
        ['Summary'],
        ['Total Sales', reportData.summary.totalSales.toFixed(2)],
        ['Total Purchases', reportData.summary.totalPurchases.toFixed(2)],
        ['Output Tax', reportData.summary.totalOutputTax.toFixed(2)],
        ['Input Tax', reportData.summary.totalInputTax.toFixed(2)],
        ['Net Tax Payable', reportData.summary.netTaxPayable.toFixed(2)],
        [''],
        ['Outward Supplies'],
        ['Description', 'Taxable Value', 'CGST', 'SGST', 'IGST'],
        ['Total Outward Supplies',
          reportData.outwardSupplies.taxableValue.toFixed(2),
          reportData.outwardSupplies.cgst.toFixed(2),
          reportData.outwardSupplies.sgst.toFixed(2),
          reportData.outwardSupplies.igst.toFixed(2)
        ],
        [''],
        ['Inward Supplies (ITC)'],
        ['Description', 'Taxable Value', 'CGST', 'SGST', 'IGST'],
        ['Total ITC Available',
          reportData.itcAvailable.taxableValue.toFixed(2),
          reportData.itcAvailable.cgst.toFixed(2),
          reportData.itcAvailable.sgst.toFixed(2),
          reportData.itcAvailable.igst.toFixed(2)
        ],
        [''],
        ['Net Tax Liability'],
        ['CGST', 'SGST', 'IGST', 'Total'],
        [
          reportData.netTaxLiability.cgst.toFixed(2),
          reportData.netTaxLiability.sgst.toFixed(2),
          reportData.netTaxLiability.igst.toFixed(2),
          reportData.netTaxLiability.total.toFixed(2)
        ]
      ];
      const gstr3bWS = XLSX.utils.aoa_to_sheet(gstr3bData);
      XLSX.utils.book_append_sheet(workbook, gstr3bWS, 'GSTR-3B');
    }
    else if (activeTab === 'taxSummary') {
      // Sales Tax sheet
      const salesData = Object.entries(reportData.salesTaxByRate).map(([rate, data]) => ({
        'GST Rate': `${rate}%`,
        'Count': data.count,
        'Taxable Value': data.taxableValue.toFixed(2),
        'CGST': data.cgst.toFixed(2),
        'SGST': data.sgst.toFixed(2),
        'IGST': data.igst.toFixed(2),
        'Total Tax': data.totalTax.toFixed(2)
      }));
      const salesWS = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesWS, 'Sales Tax');

      // Purchase Tax sheet
      const purchaseData = Object.entries(reportData.purchaseTaxByRate).map(([rate, data]) => ({
        'GST Rate': `${rate}%`,
        'Count': data.count,
        'Taxable Value': data.taxableValue.toFixed(2),
        'CGST': data.cgst.toFixed(2),
        'SGST': data.sgst.toFixed(2),
        'IGST': data.igst.toFixed(2),
        'Total Tax': data.totalTax.toFixed(2)
      }));
      const purchaseWS = XLSX.utils.json_to_sheet(purchaseData);
      XLSX.utils.book_append_sheet(workbook, purchaseWS, 'Purchase Tax');

      // Summary sheet
      const summaryData = [
        ['Tax Summary Report'],
        ['Period', `${dateRange.startDate} to ${dateRange.endDate}`],
        [''],
        ['Summary'],
        ['Total Sales Tax', reportData.summary.totalSalesTax.toFixed(2)],
        ['Total Purchase Tax', reportData.summary.totalPurchaseTax.toFixed(2)],
        ['Net Tax Liability', reportData.summary.netTaxLiability.toFixed(2)]
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    }
    else if (activeTab === 'hsnSummary') {
      const hsnData = reportData.hsnList.map(hsn => ({
        'HSN Code': hsn.hsnCode,
        'Description': hsn.description,
        'UQC': hsn.uqc,
        'Quantity': hsn.totalQuantity.toFixed(0),
        'Taxable Value': hsn.taxableValue.toFixed(2),
        'CGST': hsn.cgst.toFixed(2),
        'SGST': hsn.sgst.toFixed(2),
        'IGST': hsn.igst.toFixed(2),
        'GST Rate': `${hsn.gstRate}%`,
        'Total Tax': hsn.totalTax.toFixed(2)
      }));
      const hsnWS = XLSX.utils.json_to_sheet(hsnData);
      XLSX.utils.book_append_sheet(workbook, hsnWS, 'HSN Summary');

      // Summary
      const summaryData = [
        ['HSN Summary Report'],
        ['Period', `${dateRange.startDate} to ${dateRange.endDate}`],
        [''],
        ['Summary'],
        ['Total HSN Codes', reportData.summary.totalHSNCodes],
        ['Total Quantity', reportData.summary.totalQuantity.toFixed(0)],
        ['Total Taxable Value', reportData.summary.totalTaxableValue.toFixed(2)],
        ['Total Tax', reportData.summary.totalTax.toFixed(2)],
        ['Total Value', reportData.summary.totalValue.toFixed(2)]
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    }

    // Write file
    XLSX.writeFile(workbook, `${reportName}_${dateStr}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center no-print">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GST Reports</h1>
            <p className="text-gray-500 mt-1">Generate and export GST compliance reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('json')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <HiDownload className="w-5 h-5" />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <HiDownload className="w-5 h-5" />
              Export Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <HiDownload className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* PDF Export Help Banner */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 no-print">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">
                📄 For clean PDF exports: Turn OFF "Headers and footers" in your browser's print dialog
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This removes the browser-generated date/time text that appears at the top of PDFs (e.g., "14/12/2025, 02:38 {shopName} - Billing Software")
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 no-print">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow print-content">
          {/* Print-only header */}
          <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative h-16 w-40">
                <img
                  src="/Logo.jpeg"
                  alt={shopName}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.name} Report
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {shopSettings?.shopName || shopName}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Period:</strong> {new Date(dateRange.startDate).toLocaleDateString('en-IN')} to {new Date(dateRange.endDate).toLocaleDateString('en-IN')}
              </p>
              <p className="mt-1">
                <strong>Generated on:</strong> {new Date().toLocaleString('en-IN')}
              </p>
              {shopSettings?.gstin && (
                <p className="mt-1">
                  <strong>GSTIN:</strong> {shopSettings.gstin}
                </p>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200 no-print">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{tab.name}</span>
                    <span className="text-xs text-gray-400 mt-1">{tab.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'gstr1' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">GSTR-1 Report</h3>
                <p className="text-gray-600 mb-6">Details of outward supplies of goods and/or services</p>

                {!reportData && !loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a date range and click "Generate Report" to view GSTR-1 data</p>
                    <p className="text-sm text-gray-400 mt-2">This report will show all B2B, B2C, and export invoices</p>
                  </div>
                )}

                {loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating report...</p>
                  </div>
                )}

                {reportData && !loading && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalInvoices || 0}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Taxable Value</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalTaxableValue || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Tax</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalTax || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Invoice Value</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalInvoiceValue || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">B2B Invoices</p>
                        <p className="text-xl font-bold text-emerald-600">{reportData.summary?.b2bCount || 0}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">B2C Large (&gt;₹2.5L)</p>
                        <p className="text-xl font-bold text-blue-600">{reportData.summary?.b2cLargeCount || 0}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">B2C Small (&le;₹2.5L)</p>
                        <p className="text-xl font-bold text-purple-600">{reportData.summary?.b2cSmallCount || 0}</p>
                      </div>
                    </div>

                    {/* GST Rate-wise Summary */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">GST Rate-wise Summary</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Rate</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(reportData.gstRateTotals || {}).map(([rate, data]) => (
                              <tr key={rate}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate}%</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.taxableValue.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.cgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.sgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.igst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">₹{data.totalTax.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* B2B Invoices */}
                    {reportData.b2bInvoices && reportData.b2bInvoices.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">B2B Invoices ({reportData.b2bInvoices.length})</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.b2bInvoices.map((inv) => (
                                <tr key={inv.invoiceNumber}>
                                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{inv.invoiceNumber}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{inv.customerName}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{inv.gstin}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">₹{inv.taxableValue.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">₹{inv.cgst.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">₹{inv.sgst.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">₹{inv.igst.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">₹{inv.invoiceValue.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* B2C Small Summary */}
                    {reportData.b2cSmallSummary?.count > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">B2C Small Summary</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Total Invoices</p>
                              <p className="text-lg font-bold text-gray-900">{reportData.b2cSmallSummary?.count || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Taxable Value</p>
                              <p className="text-lg font-bold text-gray-900">₹{(reportData.b2cSmallSummary?.taxableValue || 0).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Tax</p>
                              <p className="text-lg font-bold text-gray-900">₹{(reportData.b2cSmallSummary?.totalTax || 0).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gstr3b' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">GSTR-3B Report</h3>
                <p className="text-gray-600 mb-6">Summary return for the tax period</p>

                {!reportData && !loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a date range and click "Generate Report" to view GSTR-3B summary</p>
                    <p className="text-sm text-gray-400 mt-2">This report will show tax liability and input tax credit</p>
                  </div>
                )}

                {loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating report...</p>
                  </div>
                )}

                {reportData && !loading && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalSales || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalPurchases || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Output Tax</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalOutputTax || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Net Tax Payable</p>
                        <p className="text-2xl font-bold text-emerald-600">₹{(reportData.summary?.netTaxPayable || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Outward Supplies */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Outward Supplies (Sales)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">Total Outward Supplies</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.outwardSupplies?.taxableValue || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.outwardSupplies?.cgst || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.outwardSupplies?.sgst || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.outwardSupplies?.igst || 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Inward Supplies - ITC Available */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Inward Supplies (ITC Available)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">Total ITC Available</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.itcAvailable?.taxableValue || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.itcAvailable?.cgst || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.itcAvailable?.sgst || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">₹{(reportData.itcAvailable?.igst || 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Net Tax Liability */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Net Tax Liability</h4>
                      <div className="bg-emerald-50 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">CGST Payable</p>
                            <p className="text-xl font-bold text-gray-900">₹{(reportData.netTaxLiability?.cgst || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">SGST Payable</p>
                            <p className="text-xl font-bold text-gray-900">₹{(reportData.netTaxLiability?.sgst || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">IGST Payable</p>
                            <p className="text-xl font-bold text-gray-900">₹{(reportData.netTaxLiability?.igst || 0).toFixed(2)}</p>
                          </div>
                          <div className="bg-emerald-100 rounded-lg p-4">
                            <p className="text-sm text-gray-700 mb-1 font-medium">Total Tax Payable</p>
                            <p className="text-2xl font-bold text-emerald-700">₹{(reportData.netTaxLiability?.total || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'taxSummary' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Tax Summary Report</h3>
                <p className="text-gray-600 mb-6">Detailed breakdown of CGST, SGST, and IGST</p>

                {!reportData && !loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a date range and click "Generate Report" to view tax summary</p>
                    <p className="text-sm text-gray-400 mt-2">This report will show sales tax, purchase tax, and net tax liability</p>
                  </div>
                )}

                {loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating report...</p>
                  </div>
                )}

                {reportData && !loading && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Sales Tax</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalSalesTax || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Purchase Tax (ITC)</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalPurchaseTax || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Net Tax Liability</p>
                        <p className="text-2xl font-bold text-emerald-600">₹{(reportData.summary?.netTaxLiability || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Sales Tax by Rate */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Sales Tax by Rate</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Rate</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(reportData.salesTaxByRate || {}).map(([rate, data]) => (
                              <tr key={rate}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate}%</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{data.count}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.taxableValue.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.cgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.sgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.igst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">₹{data.totalTax.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Purchase Tax by Rate */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Purchase Tax by Rate</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Rate</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(reportData.purchaseTaxByRate || {}).map(([rate, data]) => (
                              <tr key={rate}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate}%</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{data.count}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.taxableValue.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.cgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.sgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{data.igst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">₹{data.totalTax.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hsnSummary' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">HSN Summary Report</h3>
                <p className="text-gray-600 mb-6">HSN-wise summary of outward supplies</p>

                {!reportData && !loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <HiDocumentReport className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a date range and click "Generate Report" to view HSN summary</p>
                    <p className="text-sm text-gray-400 mt-2">This report will show HSN-wise quantity, taxable value, and tax amount</p>
                  </div>
                )}

                {loading && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating report...</p>
                  </div>
                )}

                {reportData && !loading && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total HSN Codes</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalHSNCodes || 0}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                        <p className="text-2xl font-bold text-gray-900">{(reportData.summary?.totalQuantity || 0).toFixed(0)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Taxable Value</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalTaxableValue || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Tax</p>
                        <p className="text-2xl font-bold text-gray-900">₹{(reportData.summary?.totalTax || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* HSN-wise Details */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">HSN-wise Details</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UQC</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">GST Rate</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tax</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(reportData.hsnList || []).map((hsn) => (
                              <tr key={hsn.hsnCode}>
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">{hsn.hsnCode}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{hsn.description}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{hsn.uqc}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{hsn.totalQuantity.toFixed(0)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{hsn.taxableValue.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{hsn.cgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{hsn.sgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">₹{hsn.igst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{hsn.gstRate}%</td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">₹{hsn.totalTax.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 15mm;
        }

        @media print {
          /* Hide everything except the report content */
          body * {
            visibility: hidden;
          }

          .no-print,
          nav,
          aside,
          header,
          .sidebar,
          button,
          .mobile-header {
            display: none !important;
          }

          /* Show print-only elements */
          .print\:block {
            display: block !important;
          }

          /* Show only the report content */
          .print-content,
          .print-content * {
            visibility: visible;
          }

          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            background: white;
          }

          /* General print styles */
          html,
          body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white;
            font-size: 12pt;
          }

          /* Table improvements */
          table {
            page-break-inside: auto;
            border-collapse: collapse;
            width: 100%;
            font-size: 10pt;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
            font-weight: bold;
          }

          tbody {
            display: table-row-group;
          }

          /* Prevent orphans and widows */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          /* Card and section styling */
          .space-y-6 > * {
            margin-bottom: 15px !important;
          }

          /* Grid layouts - avoid breaking */
          .grid {
            page-break-inside: avoid;
          }

          /* Allow tables to break across pages if needed */
          .overflow-x-auto {
            overflow: visible !important;
            page-break-inside: auto;
          }

          /* Section headings */
          h3, h4 {
            margin-top: 20px;
            margin-bottom: 10px;
          }

          /* Ensure colors print */
          .bg-blue-50,
          .bg-green-50,
          .bg-purple-50,
          .bg-orange-50,
          .bg-emerald-50,
          .bg-gray-50 {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Smaller text for tables to fit better */
          td, th {
            padding: 4px 8px !important;
            font-size: 9pt;
          }

          /* Summary cards */
          .grid.grid-cols-1,
          .grid.grid-cols-3,
          .grid.grid-cols-4 {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            page-break-inside: avoid;
          }

          .grid > div {
            flex: 1;
            min-width: 150px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
