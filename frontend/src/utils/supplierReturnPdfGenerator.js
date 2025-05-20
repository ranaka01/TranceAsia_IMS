/**
 * Utility functions for generating supplier return receipt PDFs
 *
 * NOTE: This file requires the following packages to be installed:
 * npm install jspdf jspdf-autotable --save
 */

import { jsPDF } from 'jspdf';
import { jwtDecode } from 'jwt-decode';

// Company information
const COMPANY_INFO = {
  name: 'Trance Asia Computers',
  address: '123 Main Street, Ambalantota, Sri Lanka',
  phone: '+94 77 009 3285',
  email: 'tranceasiacomputers@gmail.com',
};

/**
 * Format currency value
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';

  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date to YYYY-MM-DD
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    // If the date string is already in YYYY-MM-DD format, return it as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If the date string contains a 'T', it's in ISO format, so extract just the date part
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return dateString.split('T')[0];
    }

    // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
    if (typeof dateString === 'string' && dateString.includes(' ') && dateString.includes(':')) {
      return dateString.split(' ')[0];
    }

    // Otherwise, try to format it as a date
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString);
      return 'N/A';
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error, "for date string:", dateString);
    return 'N/A';
  }
};

/**
 * Get current user information from token
 * @returns {Object} - User information
 */
const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      return {
        id: decoded.userId,
        username: decoded.username || '',
        email: decoded.email || '',
        role: decoded.role || ''
      };
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }

  return {
    username: 'Unknown User'
  };
};

/**
 * Generate a supplier return receipt PDF
 * @param {Object} returnItem - The return object containing all return details
 * @returns {jsPDF} - The generated PDF document
 */
export const generateSupplierReturnReceipt = (returnItem) => {
  console.log("Starting PDF generation with data:", returnItem);

  try {
    // Validate the returnItem
    if (!returnItem || !returnItem.return_id) {
      console.error("Invalid return item data:", returnItem);
      throw new Error("Invalid return data");
    }

    // Create a new PDF document with wider margins
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    console.log("PDF document created");

    // Set document properties
    doc.setProperties({
      title: `Supplier Return Receipt #${returnItem.return_id}`,
      subject: 'Return Receipt',
      creator: 'Trance Asia Computers',
      author: 'Trance Asia Computers'
    });

    // Set default font
    doc.setFont('helvetica');

    // Add company header
    console.log("Adding company header");
    addCompanyHeader(doc);

    // Add receipt title and return ID
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RETURN RECEIPT', 105, 36, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Return ID: #${returnItem.return_id}`, 105, 42, { align: 'center' });

    // Add current date and return date
    const currentDate = new Date().toISOString().split('T')[0];
    const returnDate = formatDate(returnItem.return_date);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Print Date: ${currentDate}`, 20, 50);
    doc.text(`Return Date: ${returnDate}`, 20, 55);

    // Define starting Y positions for each section
    const supplierInfoYPos = 70;
    const productInfoYPos = 120;
    const financialSummaryYPos = 180;
    const signatureSectionYPos = 240;

    // Add supplier information section
    console.log("Adding supplier information");
    addSupplierInfo(doc, returnItem, supplierInfoYPos);

    // Add product information section
    console.log("Adding product information");
    addProductInfo(doc, returnItem, productInfoYPos);

    // Add financial summary section
    console.log("Adding financial summary");
    addFinancialSummary(doc, returnItem, financialSummaryYPos);

    // Add signature section
    console.log("Adding signature section");
    addSignatureSection(doc, signatureSectionYPos);

    // Add footer
    console.log("Adding footer");
    addFooter(doc);

    console.log("PDF generation completed successfully");
    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    console.error("Error details:", error.message, error.stack);

    // Create a simple error PDF instead of returning null
    const errorDoc = new jsPDF();
    errorDoc.setFont('helvetica', 'bold');
    errorDoc.setFontSize(16);
    errorDoc.text('Error Generating Return Receipt', 105, 20, { align: 'center' });

    errorDoc.setFont('helvetica', 'normal');
    errorDoc.setFontSize(12);
    errorDoc.text('There was an error generating the return receipt.', 105, 40, { align: 'center' });
    errorDoc.text(`Error: ${error.message}`, 105, 50, { align: 'center' });
    errorDoc.text('Please try again or contact support.', 105, 60, { align: 'center' });

    return errorDoc;
  }
};

/**
 * Add company header to the PDF
 * @param {jsPDF} doc - The PDF document
 */
const addCompanyHeader = (doc) => {
  const pageWidth = doc.internal.pageSize.width;

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 105, 15, { align: 'center' });

  // Company address and contact info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 105, 20, { align: 'center' });
  doc.text(`Tel: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 105, 24, { align: 'center' });

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, 28, pageWidth - 15, 28);
};

/**
 * Add supplier information section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} returnItem - The return object
 * @param {number} yPos - The Y position to start drawing
 */
const addSupplierInfo = (doc, returnItem, yPos) => {
  try {
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier Information', 20, yPos);

    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Get supplier details with safeguards
    const supplierName = returnItem.supplier_name || 'N/A';
    const shopName = returnItem.shop_name || 'N/A';
    //const supplierPhone = returnItem.supplier_phone || 'N/A';
    //const supplierEmail = returnItem.supplier_email || 'N/A';

    // Use direct text placement instead of tables
    const startY = yPos + 8;
    const lineHeight = 5;
    const col1X = 20;
    const col2X = 60;

    doc.setFontSize(8);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier Name:', col1X, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(supplierName), col2X, startY);

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('Shop Name:', col1X, startY + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(String(shopName), col2X, startY + lineHeight);

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('', col1X, startY + lineHeight * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(String(supplierPhone), col2X, startY + lineHeight * 2);

    // Row 4
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', col1X, startY + lineHeight * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(String(supplierEmail), col2X, startY + lineHeight * 3);
  } catch (error) {
    console.error("Error adding supplier information:", error);

    // Add error message to the PDF instead of failing
    // doc.setFontSize(8);
    // doc.setFont('helvetica', 'bold');
    // doc.text('Error displaying supplier information', 20, yPos + 10);
    // doc.setFont('helvetica', 'normal');
    // doc.text('Please check the supplier data and try again.', 20, yPos + 15);
  }
};

/**
 * Add product information section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} returnItem - The return object
 * @param {number} yPos - The Y position to start drawing
 */
const addProductInfo = (doc, returnItem, yPos) => {
  try {
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Information', 20, yPos);

    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Get product details with safeguards
    const productName = returnItem.product_name || 'N/A';
    const productId = returnItem.product_id || 'N/A';
    const purchaseId = returnItem.purchase_id || 'N/A';
    const purchaseDate = formatDate(returnItem.purchase_date);

    // Truncate return reason if it's too long to prevent overflow
    let returnReason = returnItem.return_reason || 'N/A';
    if (returnReason.length > 50) {
      returnReason = returnReason.substring(0, 50) + '...';
    }

    // Use direct text placement instead of tables
    const startY = yPos + 8;
    const lineHeight = 5;
    const col1X = 20;
    const col2X = 60;

    doc.setFontSize(8);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Product Name:', col1X, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(productName), col2X, startY);

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('Product ID:', col1X, startY + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(String(productId), col2X, startY + lineHeight);

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('Purchase ID:', col1X, startY + lineHeight * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(String(purchaseId), col2X, startY + lineHeight * 2);

    // Row 4
    doc.setFont('helvetica', 'bold');
    doc.text('Purchase Date:', col1X, startY + lineHeight * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(String(purchaseDate), col2X, startY + lineHeight * 3);

    // Row 5
    doc.setFont('helvetica', 'bold');
    doc.text('Return Reason:', col1X, startY + lineHeight * 4);
    doc.setFont('helvetica', 'normal');

    // Handle long return reasons by wrapping text
    const maxWidth = 130;
    const reasonLines = doc.splitTextToSize(String(returnReason), maxWidth);
    doc.text(reasonLines, col2X, startY + lineHeight * 4);
  } catch (error) {
    console.error("Error adding product information:", error);

    // Add error message to the PDF instead of failing
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Error displaying product information', 20, yPos + 10);
    doc.setFont('helvetica', 'normal');
    doc.text('Please check the product data and try again.', 20, yPos + 15);
  }
};

/**
 * Add financial summary section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} returnItem - The return object
 * @param {number} yPos - The Y position to start drawing
 */
const addFinancialSummary = (doc, returnItem, yPos) => {
  try {
    // Section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, yPos);

    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Get financial details with safeguards
    let quantity = 0;
    try {
      quantity = parseInt(returnItem.quantity) || 0;
    } catch (e) {
      console.warn("Error parsing quantity:", e);
      quantity = 0;
    }

    let buyingPrice = 0;
    try {
      buyingPrice = parseFloat(returnItem.buying_price) || 0;
    } catch (e) {
      console.warn("Error parsing buying price:", e);
      buyingPrice = 0;
    }

    const totalValue = buyingPrice * quantity;

    let refundAmount = totalValue;
    try {
      if (returnItem.refund_amount !== undefined && returnItem.refund_amount !== null) {
        refundAmount = parseFloat(returnItem.refund_amount) || totalValue;
      }
    } catch (e) {
      console.warn("Error parsing refund amount:", e);
      refundAmount = totalValue;
    }

    // Use direct text placement instead of tables
    const startY = yPos + 8;
    const lineHeight = 5;
    const col1X = 20;
    const col2X = 100;

    doc.setFontSize(8);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Quantity:', col1X, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(quantity.toString(), col2X, startY, { align: 'right' });

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('Purchase Price:', col1X, startY + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${formatCurrency(buyingPrice)}`, col2X, startY + lineHeight, { align: 'right' });

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('Total Value:', col1X, startY + lineHeight * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${formatCurrency(totalValue)}`, col2X, startY + lineHeight * 2, { align: 'right' });

    // Row 4
    doc.setFont('helvetica', 'bold');
    doc.text('Refund Amount:', col1X, startY + lineHeight * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${formatCurrency(refundAmount)}`, col2X, startY + lineHeight * 3, { align: 'right' });

    // Add horizontal line for total
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, startY + lineHeight * 4, 100, startY + lineHeight * 4);

    // Add processed by information
    const currentUser = getCurrentUser();
    const processedBy = currentUser.username || 'Unknown User';

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Processed by: ${processedBy}`, 20, startY + lineHeight * 5 + 2);

    // Add notes if available
    if (returnItem.notes) {
      doc.text('Notes:', 20, startY + lineHeight * 6 + 2);
      // Limit notes to a reasonable length to prevent overflow
      const truncatedNotes = returnItem.notes.length > 300
        ? returnItem.notes.substring(0, 300) + '...'
        : returnItem.notes;
      const notesLines = doc.splitTextToSize(String(truncatedNotes), 150);
      // Limit to 5 lines maximum to prevent overflow
      const limitedNotesLines = notesLines.slice(0, 5);
      doc.text(limitedNotesLines, 20, startY + lineHeight * 7 + 2);
    }
  } catch (error) {
    console.error("Error adding financial summary:", error);

    // Add error message to the PDF instead of failing
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Error displaying financial summary', 20, yPos + 10);
    doc.setFont('helvetica', 'normal');
    doc.text('Please check the financial data and try again.', 20, yPos + 15);
  }
};

/**
 * Add signature section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {number} yPos - The Y position to start drawing
 */
const addSignatureSection = (doc, yPos) => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Add signature lines
  doc.line(30, yPos + 15, 80, yPos + 15);
  doc.line(120, yPos + 15, 170, yPos + 15);

  doc.text('Supplier Signature', 55, yPos + 20, { align: 'center' });
  doc.text('Authorized Signature', 145, yPos + 20, { align: 'center' });
};

/**
 * Add footer to the PDF
 * @param {jsPDF} doc - The PDF document
 */
const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

  // Add thank you message and return policy in one line
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business! | Return Policy: All returns must be processed within 14 days of purchase.', 105, pageHeight - 15, { align: 'center' });

  // Add copyright information
  doc.setFontSize(7);
  doc.text(`© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.`, 105, pageHeight - 10, { align: 'center' });
};

/**
 * Open the PDF in a new window for printing
 * @param {jsPDF} doc - The PDF document
 */
export const printPDF = (doc) => {
  try {
    console.log("Starting PDF display process...");

    // Check if the PDF document is valid
    if (!doc) {
      console.error("PDF document is null or undefined");
      throw new Error("Invalid PDF document");
    }

    // Generate binary PDF data
    console.log("Generating PDF binary data...");
    const pdfBlob = doc.output('blob');
    console.log("PDF blob created:", pdfBlob);

    // Create a URL for the blob
    const blobUrl = URL.createObjectURL(pdfBlob);
    console.log("Blob URL created:", blobUrl);

    // First approach: Try to open in a new window
    console.log("Attempting to open PDF in new window...");
    const newWindow = window.open(blobUrl, '_blank');

    if (!newWindow) {
      console.warn('Pop-up blocked. Trying alternative method...');

      // Second approach: Create a download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `supplier-return-receipt-${new Date().getTime()}.pdf`;

      console.log("Created download link:", link);
      document.body.appendChild(link);

      // Trigger click event
      console.log("Clicking download link...");
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        console.log("Download link removed and blob URL revoked");
      }, 100);
    } else {
      console.log("New window opened successfully");

      // Clean up the blob URL after the window is loaded
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        console.log("Blob URL revoked");
      }, 1000);
    }
  } catch (error) {
    console.error('Error in PDF display process:', error);
    console.error('Error details:', error.message, error.stack);

    // Final fallback: Save the PDF directly using the built-in method
    try {
      console.log("Attempting direct save as fallback...");
      const filename = `supplier-return-receipt-${new Date().getTime()}.pdf`;
      doc.save(filename);
      console.log("PDF saved directly as:", filename);
      alert(`PDF saved as ${filename}. Please check your downloads folder.`);
    } catch (fallbackError) {
      console.error('All PDF display methods failed:', fallbackError);
      console.error('Fallback error details:', fallbackError.message, fallbackError.stack);
      alert('Failed to open or save PDF. Please check your browser settings and try again.');
    }
  }
};

/**
 * Save the PDF to file
 * @param {jsPDF} doc - The PDF document
 * @param {string} filename - The filename to save as
 */
export const savePDF = (doc, filename) => {
  doc.save(filename);
};
