import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { apiService } from '../services/apiService';

// Install required packages: npm install file-saver xlsx jspdf jspdf-autotable

export const exportUtils = {
  // Export to CSV
  exportToCSV: (data, filename = 'export') => {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }
    
    // Convert data to CSV string
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Create and download CSV file
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  },
  
  // Export to Excel
  exportToExcel: (data, filename = 'export', sheetName = 'Sheet1') => {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },
  
  // Export to PDF
  exportToPDF: (title, data, columns, filename = 'export') => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    
    // Prepare table data
    const tableData = data.map(row => 
      columns.map(col => row[col.key] || '')
    );
    
    // Add table
    doc.autoTable({
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  },
  
  // Export specific module data
  exportModuleData: async (module, format = 'csv', params = {}) => {
    try {
      let data;
      
      switch (module) {
        case 'products':
          const productsRes = await apiService.products.getProducts(params);
          data = productsRes.data.data;
          break;
          
        case 'sales':
          const salesRes = await apiService.sales.getSales(params);
          data = salesRes.data.data;
          break;
          
        case 'inventory':
          const inventoryRes = await apiService.inventory.getTransactions(params);
          data = inventoryRes.data.data;
          break;
          
        case 'production':
          const productionRes = await apiService.production.getProductions(params);
          data = productionRes.data.data;
          break;
          
        default:
          throw new Error(`Unsupported module: ${module}`);
      }
      
      const filename = `${module}_export`;
      
      switch (format) {
        case 'csv':
          exportUtils.exportToCSV(data, filename);
          break;
          
        case 'excel':
          exportUtils.exportToExcel(data, filename, module);
          break;
          
        case 'pdf':
          // Define columns based on module
          const columns = getModuleColumns(module);
          exportUtils.exportToPDF(`${module.toUpperCase()} Report`, data, columns, filename);
          break;
          
        default:
          exportUtils.exportToCSV(data, filename);
      }
      
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  },
};

// Helper function to get module columns
const getModuleColumns = (module) => {
  const columnConfigs = {
    products: [
      { key: 'product_name', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'unit_price', label: 'Price' },
      { key: 'cost_price', label: 'Cost' },
      { key: 'current_stock', label: 'Stock' },
      { key: 'min_stock_level', label: 'Min Stock' },
    ],
    sales: [
      { key: 'customer_name', label: 'Customer' },
      { key: 'product_name', label: 'Product' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'total_amount', label: 'Amount' },
      { key: 'sale_date', label: 'Date' },
      { key: 'payment_status', label: 'Status' },
    ],
    inventory: [
      { key: 'product_name', label: 'Product' },
      { key: 'transaction_type', label: 'Type' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit_price', label: 'Unit Price' },
      { key: 'total_value', label: 'Total Value' },
      { key: 'transaction_date', label: 'Date' },
    ],
    production: [
      { key: 'product_name', label: 'Product' },
      { key: 'planned_quantity', label: 'Planned' },
      { key: 'actual_quantity', label: 'Actual' },
      { key: 'efficiency', label: 'Efficiency %' },
      { key: 'status', label: 'Status' },
      { key: 'production_date', label: 'Date' },
    ],
  };
  
  return columnConfigs[module] || [];
};

export default exportUtils;