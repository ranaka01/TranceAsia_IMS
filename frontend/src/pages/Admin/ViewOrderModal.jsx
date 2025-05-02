import React from "react";
import Button from "./Button";

const ViewOrderModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  // Calculate order totals and profit
  const orderTotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Calculate received totals and profit
  const receivedTotal = order.items.reduce(
    (sum, item) => sum + (item.received || 0) * (item.actualPrice || item.unitPrice),
    0
  );

  // Calculate potential profit if selling prices are available
  const potentialProfit = order.items.reduce((sum, item) => {
    if (item.sellingPrice) {
      const costPrice = item.actualPrice || item.unitPrice;
      const profit = (item.sellingPrice - costPrice) * item.quantity;
      return sum + profit;
    }
    return sum;
  }, 0);

  // Calculate profit percentage
  const profitPercentage = orderTotal > 0 && potentialProfit > 0
    ? Math.round((potentialProfit / orderTotal) * 100 * 100) / 100
    : 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full h-full max-h-screen overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Order Header Information */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date Created</p>
              <p className="font-medium">{order.dateCreated}</p>
              {order.timeCreated && (
                <p className="text-xs text-gray-500">{order.timeCreated}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Supplier</p>
              <p className="font-medium">{order.supplierName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "Partially Received"
                      ? "bg-purple-100 text-purple-800"
                      : order.status === "Fully Received"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {order.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="font-medium">{order.items.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Value</p>
              <p className="font-medium">Rs. {orderTotal.toLocaleString()}</p>
              {receivedTotal > 0 && (
                <p className="text-xs text-gray-500">
                  Received: Rs. {receivedTotal.toLocaleString()}
                </p>
              )}
            </div>
            {potentialProfit > 0 && (
              <div className="absolute right-6 top-24 mr-4">
                <div className="text-right">
                  <span className="text-5xl font-bold text-gray-400 italic">profit</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{order.notes}</p>
            </div>
          )}

          {/* Order Items */}
          <div className="flex-1 mb-6 flex flex-col">
            <h3 className="text-md font-medium mb-2">Order Items</h3>
            <div className="border rounded-md flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supply Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordered Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received Qty
                      </th>
                      {order.items.some(item => item.actualPrice && item.actualPrice !== item.unitPrice) && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actual Price
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => {
                      // Calculate profit percentage if we have selling price
                      let profitPercentage = 0;
                      if (item.sellingPrice && (item.actualPrice || item.unitPrice)) {
                        const costPrice = item.actualPrice || item.unitPrice;
                        profitPercentage = ((item.sellingPrice - costPrice) / costPrice) * 100;
                        profitPercentage = Math.round(profitPercentage * 100) / 100; // Round to 2 decimal places
                      }
                      
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-xs text-gray-500">{item.id}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            Rs. {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm">
                            Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {item.received || 0}/{item.quantity}
                          </td>
                          {order.items.some(item => item.actualPrice && item.actualPrice !== item.unitPrice) && (
                            <td className="px-4 py-3 text-sm">
                              {item.actualPrice && item.actualPrice !== item.unitPrice
                                ? `Rs. ${item.actualPrice.toLocaleString()}`
                                : "-"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            {item.sellingPrice 
                              ? `Rs. ${item.sellingPrice.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                !item.received
                                  ? "bg-gray-100 text-gray-800"
                                  : item.received < item.quantity
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {!item.received
                                ? "Not Received"
                                : item.received < item.quantity
                                ? "Partially Received"
                                : "Fully Received"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Receipt History */}
          {order.receiptHistory && order.receiptHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Receipt History</h3>
              <div className="space-y-4">
                {order.receiptHistory.map((receipt, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-sm font-medium">Receipt #{index + 1}</h4>
                      <div>
                        <p className="text-sm text-gray-500">{receipt.date}</p>
                        {receipt.time && <p className="text-xs text-gray-500">{receipt.time}</p>}
                      </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Supply Price
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Supply Value
                          </th>
                          {receipt.items.some(item => item.sellingPrice) && (
                            <>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Selling Price
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Potential Revenue
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Profit Margin
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {receipt.items.map((item, itemIndex) => {
                          const orderItem = order.items.find(oi => oi.id === item.id);
                          
                          // Calculate profit metrics if we have selling price
                          let profitPercentage = 0;
                          let potentialRevenue = 0;
                          let profitMargin = 0;
                          
                          if (item.sellingPrice && item.supplyPrice) {
                            profitPercentage = ((item.sellingPrice - item.supplyPrice) / item.supplyPrice) * 100;
                            profitPercentage = Math.round(profitPercentage * 100) / 100; // Round to 2 decimal places
                            
                            potentialRevenue = item.receivedQuantity * item.sellingPrice;
                            profitMargin = potentialRevenue - (item.receivedQuantity * item.supplyPrice);
                          }
                          
                          return (
                            <tr key={itemIndex}>
                              <td className="px-4 py-2 text-sm">
                                {orderItem?.name || item.id}
                              </td>
                              <td className="px-4 py-2 text-sm">{item.receivedQuantity}</td>
                              <td className="px-4 py-2 text-sm">
                                Rs. {item.supplyPrice.toLocaleString()}
                                {orderItem && item.supplyPrice !== orderItem.unitPrice && (
                                  <div className="text-xs text-gray-500">
                                    (Original: Rs. {orderItem.unitPrice.toLocaleString()})
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                Rs. {(item.receivedQuantity * item.supplyPrice).toLocaleString()}
                              </td>
                              {receipt.items.some(item => item.sellingPrice) && (
                                <>
                                  <td className="px-4 py-2 text-sm">
                                    {item.sellingPrice 
                                      ? `Rs. ${item.sellingPrice.toLocaleString()}`
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {potentialRevenue > 0 
                                      ? `Rs. ${potentialRevenue.toLocaleString()}`
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {profitMargin > 0 
                                      ? <>
                                          Rs. {profitMargin.toLocaleString()}
                                          <div className="text-xs text-gray-500">
                                            ({profitPercentage}%)
                                          </div>
                                        </>
                                      : "-"}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-auto">
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;