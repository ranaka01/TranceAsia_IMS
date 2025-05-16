import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import API from '../../utils/api';

const SalesDetailsModal = ({ isOpen, onClose, saleId }) => {
  const [sale, setSale] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!saleId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await API.get(`/sales/${saleId}`);
        setSale(response.data?.data?.sale || null);
      } catch (err) {
        console.error('Error fetching sale details:', err);
        setError('Failed to load sale details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen && saleId) {
      fetchSaleDetails();
    }
  }, [isOpen, saleId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', '').trim();
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold">
            {sale ? `Sale #${sale.bill_no}` : 'Sale Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
              <button
                className="ml-2 underline"
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  // Re-fetch sale details
                  API.get(`/sales/${saleId}`)
                    .then(response => {
                      setSale(response.data?.data?.sale || null);
                    })
                    .catch(err => {
                      console.error('Error re-fetching sale details:', err);
                      setError('Failed to load sale details. Please try again.');
                    })
                    .finally(() => {
                      setIsLoading(false);
                    });
                }}
              >
                Try Again
              </button>
            </div>
          ) : sale ? (
            <div>
              {/* Sale Header Information */}
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Sale Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-gray-500">Invoice No:</div>
                      <div className="text-sm">{sale.bill_no}</div>
                      
                      <div className="text-sm font-medium text-gray-500">Date:</div>
                      <div className="text-sm">{formatDate(sale.date)}</div>
                      
                      <div className="text-sm font-medium text-gray-500">Payment Method:</div>
                      <div className="text-sm">{sale.payment_method || 'Cash'}</div>
                      
                      <div className="text-sm font-medium text-gray-500">Cashier:</div>
                      <div className="text-sm">{sale.user_name || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-gray-500">Name:</div>
                      <div className="text-sm">{sale.customer_name || 'Walk-in Customer'}</div>
                      
                      <div className="text-sm font-medium text-gray-500">Phone:</div>
                      <div className="text-sm">{sale.customer_phone || 'N/A'}</div>
                      
                      <div className="text-sm font-medium text-gray-500">Email:</div>
                      <div className="text-sm">{sale.customer_email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sale Items */}
              <h3 className="text-md font-medium text-gray-700 mb-2">Sale Items</h3>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warranty
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sale.items && sale.items.length > 0 ? (
                      sale.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.serial_no || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.warranty} months
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.discount}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No items found for this sale
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Subtotal:
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(sale.subtotal || 0)}
                      </td>
                    </tr>
                    {sale.discount > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          Discount:
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {formatCurrency(sale.discount || 0)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-100">
                      <td colSpan="6" className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        Total:
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                        {formatCurrency(sale.total || 0)}
                      </td>
                    </tr>
                    {sale.payment_amount && (
                      <>
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            Amount Paid:
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {formatCurrency(sale.payment_amount)}
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            Change:
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {formatCurrency(sale.change_amount || 0)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    // Handle printing invoice
                    window.print();
                  }}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p>Sale information not found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesDetailsModal;