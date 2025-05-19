import React, { useEffect, useState } from 'react';
import { generateRepairReceipt, savePDF, printPDF } from '../../utils/simplePdfGenerator';

/**
 * Modal component for displaying a repair receipt PDF
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.repair - The repair object to generate a receipt for
 * @param {Array} props.technicians - Array of technician objects for name lookup
 */
const RepairReceiptModal = ({ isOpen, onClose, repair, technicians = [] }) => {
  const [pdfDataUrl, setPdfDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && repair) {
      setIsLoading(true);
      setError(null);

      // Use setTimeout to ensure this runs after the component is mounted
      setTimeout(() => {
        try {
          // Generate the PDF document
          const doc = generateRepairReceipt(repair, technicians);

          // Convert to data URL
          const dataUrl = doc.output('datauristring');
          setPdfDataUrl(dataUrl);
          setIsLoading(false);
        } catch (err) {
          console.error('Error generating PDF:', err);
          setError(`Failed to generate PDF receipt: ${err.message}`);
          setIsLoading(false);
        }
      }, 100);
    }
  }, [isOpen, repair]);

  // Handle download button click
  const handleDownload = () => {
    try {
      setIsLoading(true);
      setError(null);

      setTimeout(() => {
        try {
          const doc = generateRepairReceipt(repair, technicians);
          const filename = `repair-receipt-${repair.id}.pdf`;
          savePDF(doc, filename);
          setIsLoading(false);
        } catch (err) {
          console.error('Error downloading PDF:', err);
          setError(`Failed to download PDF receipt: ${err.message}`);
          setIsLoading(false);
        }
      }, 100);
    } catch (err) {
      console.error('Error in handleDownload:', err);
      setError(`Failed to download PDF receipt: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Handle print button click
  const handlePrint = () => {
    try {
      setIsLoading(true);
      setError(null);

      setTimeout(() => {
        try {
          const doc = generateRepairReceipt(repair, technicians);
          printPDF(doc);
          setIsLoading(false);
        } catch (err) {
          console.error('Error printing PDF:', err);
          setError(`Failed to print PDF receipt: ${err.message}`);
          setIsLoading(false);
        }
      }, 100);
    } catch (err) {
      console.error('Error in handlePrint:', err);
      setError(`Failed to print PDF receipt: ${err.message}`);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-4 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-lg font-semibold">
            Repair Receipt - #{repair?.id}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading || error}
            >
              Download
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={isLoading || error}
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-600">{error}</div>
            </div>
          ) : (
            <iframe
              src={pdfDataUrl}
              className="w-full h-full border-0"
              title={`Repair Receipt - #${repair?.id}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairReceiptModal;
