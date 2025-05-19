/**
 * Utility functions for generating PDF documents
 *
 * NOTE: This file requires the following packages to be installed:
 * npm install jspdf jspdf-autotable html2canvas --save
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDeadlineDate } from './dateUtils';

// Company information
const COMPANY_INFO = {
  name: 'Trance Asia Computers',
  address: '123 Tech Street, Colombo, Sri Lanka',
  phone: '+94 11 234 5678',
  email: 'info@tranceasia.com',
  website: 'www.tranceasia.com',
  logo: '/logo.svg' // Path to company logo
};

/**
 * Generate a repair receipt PDF
 * @param {Object} repair - The repair object containing all repair details
 * @returns {jsPDF} - The generated PDF document
 */
export const generateRepairReceipt = (repair) => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set default font
  doc.setFont('helvetica');

  // Add company header
  addCompanyHeader(doc);

  // Add receipt title and repair ID
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REPAIR RECEIPT', 105, 40, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Repair ID: #${repair.id}`, 105, 48, { align: 'center' });

  // Add current date and completion date
  const currentDate = new Date().toLocaleDateString();
  const completionDate = repair.dateCompleted ? formatDeadlineDate(repair.dateCompleted) : 'N/A';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Date: ${currentDate}`, 20, 55);
  doc.text(`Completion Date: ${completionDate}`, 20, 60);

  // Add "PAID" watermark
  addPaidWatermark(doc);

  // Add customer information section
  addCustomerInfo(doc, repair, 70);

  // Add device information section
  addDeviceInfo(doc, repair, 100);

  // Add service details section
  addServiceDetails(doc, repair, 130);

  // Add financial summary section
  addFinancialSummary(doc, repair, 170);

  // Add signature section
  addSignatureSection(doc, 230);

  // Add footer
  addFooter(doc);

  return doc;
};

/**
 * Add company header to the PDF
 * @param {jsPDF} doc - The PDF document
 */
const addCompanyHeader = (doc) => {
  // Add company name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 105, 20, { align: 'center' });

  // Add company contact information
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 105, 25, { align: 'center' });
  doc.text(`Tel: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 105, 30, { align: 'center' });
  doc.text(`Website: ${COMPANY_INFO.website}`, 105, 35, { align: 'center' });

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 37, 190, 37);
};

/**
 * Add "PAID" watermark to the PDF
 * @param {jsPDF} doc - The PDF document
 */
const addPaidWatermark = (doc) => {
  doc.setFontSize(60);
  doc.setTextColor(220, 220, 220); // Light gray
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', 105, 140, { align: 'center', angle: 45 });
  doc.setTextColor(0, 0, 0); // Reset to black
};

/**
 * Add customer information section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} repair - The repair object
 * @param {number} yPos - The Y position to start drawing
 */
const addCustomerInfo = (doc, repair, yPos) => {
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', 20, yPos);

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(20, yPos + 2, 190, yPos + 2);

  // Customer details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const customerName = repair.customer || 'N/A';
  const customerPhone = repair.phone || 'N/A';
  const customerEmail = repair.email || 'Not Available';

  doc.text(`Name: ${customerName}`, 20, yPos + 10);
  doc.text(`Phone: ${customerPhone}`, 20, yPos + 16);
  doc.text(`Email: ${customerEmail}`, 20, yPos + 22);
};

/**
 * Add device information section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} repair - The repair object
 * @param {number} yPos - The Y position to start drawing
 */
const addDeviceInfo = (doc, repair, yPos) => {
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Device Information', 20, yPos);

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(20, yPos + 2, 190, yPos + 2);

  // Device details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const deviceType = repair.deviceType || 'N/A';
  const deviceModel = repair.deviceModel || 'N/A';
  const serialNumber = repair.serialNumber || 'N/A';

  doc.text(`Device Type: ${deviceType}`, 20, yPos + 10);
  doc.text(`Model: ${deviceModel}`, 20, yPos + 16);
  doc.text(`Serial Number: ${serialNumber}`, 20, yPos + 22);
};

/**
 * Add service details section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} repair - The repair object
 * @param {number} yPos - The Y position to start drawing
 */
const addServiceDetails = (doc, repair, yPos) => {
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Service Details', 20, yPos);

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(20, yPos + 2, 190, yPos + 2);

  // Service details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const issue = repair.issue || 'N/A';
  const resolution = repair.resolution || 'Repair completed successfully';

  // Format products array into a string
  let productsUsed = 'None';
  if (repair.products && repair.products.length > 0) {
    productsUsed = repair.products.join(', ');
  }

  // Add issue with word wrapping
  doc.text('Original Issue:', 20, yPos + 10);
  const issueLines = doc.splitTextToSize(issue, 160);
  doc.text(issueLines, 20, yPos + 16);

  // Add resolution with word wrapping
  const resolutionYPos = yPos + 16 + (issueLines.length * 5);
  doc.text('Resolution:', 20, resolutionYPos);
  const resolutionLines = doc.splitTextToSize(resolution, 160);
  doc.text(resolutionLines, 20, resolutionYPos + 6);

  // Add parts used with word wrapping
  const partsYPos = resolutionYPos + 6 + (resolutionLines.length * 5);
  doc.text('Parts Used:', 20, partsYPos);
  const partsLines = doc.splitTextToSize(productsUsed, 160);
  doc.text(partsLines, 20, partsYPos + 6);
};

/**
 * Add financial summary section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {Object} repair - The repair object
 * @param {number} yPos - The Y position to start drawing
 */
const addFinancialSummary = (doc, repair, yPos) => {
  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 20, yPos);

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(20, yPos + 2, 190, yPos + 2);

  // Parse financial values
  const estimatedCost = parseFloat(repair.estimatedCost?.replace(/,/g, '') || 0);
  const extraExpenses = parseFloat(repair.extraExpenses?.replace(/,/g, '') || 0);
  const advancePayment = parseFloat(repair.advancePayment?.replace(/,/g, '') || 0);
  const finalAmount = estimatedCost + extraExpenses - advancePayment;

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Financial details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Create a table for financial summary
  const tableData = [
    ['Estimated Repair Cost', formatCurrency(estimatedCost)],
    ['Extra Expenses', formatCurrency(extraExpenses)],
    ['Advance Payment', `(${formatCurrency(advancePayment)})`],
    ['Final Amount Paid', formatCurrency(finalAmount)]
  ];

  // Draw the table
  autoTable(doc, {
    startY: yPos + 7,
    head: [['Description', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    tableWidth: 150
  });

  // Add technician information
  const technicianYPos = doc.previousAutoTable.finalY + 10;
  doc.text(`Technician: ${repair.technician || 'N/A'}`, 20, technicianYPos);

  // Add warranty information
  const warrantyStatus = repair.isUnderWarranty ? 'Under Warranty' : 'No Warranty';
  doc.text(`Warranty Status: ${warrantyStatus}`, 20, technicianYPos + 6);

  // Add additional notes if available
  if (repair.additionalNotes) {
    doc.text('Additional Notes:', 20, technicianYPos + 12);
    const notesLines = doc.splitTextToSize(repair.additionalNotes, 160);
    doc.text(notesLines, 20, technicianYPos + 18);
  }
};

/**
 * Add signature section to the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {number} yPos - The Y position to start drawing
 */
const addSignatureSection = (doc, yPos) => {
  // Add signature lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  // Customer signature
  doc.line(30, yPos, 80, yPos);
  doc.setFontSize(8);
  doc.text('Customer Signature', 55, yPos + 5, { align: 'center' });

  // Authorized signature
  doc.line(130, yPos, 180, yPos);
  doc.text('Authorized Signature', 155, yPos + 5, { align: 'center' });

  // Date lines
  doc.setFontSize(8);
  doc.text('Date: ________________', 55, yPos + 15, { align: 'center' });
  doc.text('Date: ________________', 155, yPos + 15, { align: 'center' });
};

/**
 * Add footer to the PDF
 * @param {jsPDF} doc - The PDF document
 */
const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;

  // Add horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);

  // Add thank you message
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });

  // Add contact information
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`For any inquiries, please contact us at ${COMPANY_INFO.phone} or ${COMPANY_INFO.email}`, 105, pageHeight - 15, { align: 'center' });

  // Add copyright information
  doc.setFontSize(8);
  doc.text(`© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.`, 105, pageHeight - 10, { align: 'center' });
};

/**
 * Save or print the PDF
 * @param {jsPDF} doc - The PDF document
 * @param {string} filename - The filename to save as
 */
export const savePDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Open the PDF in a new window for printing
 * @param {jsPDF} doc - The PDF document
 */
export const printPDF = (doc) => {
  const pdfData = doc.output('datauristring');
  const newWindow = window.open();
  newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfData}'></iframe>`);
};
