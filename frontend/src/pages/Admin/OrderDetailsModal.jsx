import React from "react";
import Button from "./Button";

const OrderDetailsModal = ({ isOpen, onClose, order, onAccept }) => {
  if (!isOpen || !order) return null;

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Created":
        return "bg-yellow-100 text-yellow-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // This function should be defined outside the return statement
  const renderOrderDetailButton = () => {
    if (order.status === "Created") {
      return (
        <div className="p-6 border-t">
          <Button
            onClick={() => onAccept(order.id)}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Accept order
          </Button>
        </div>
      );
    } else if (order.status === "Accepted") {
      return (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => onAccept(order.id)} // This will trigger the receive items flow
            variant="outline"
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Order details
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 flex z-50">
      {/* Left panel - Order items */}
      <div className="w-3/5 bg-white overflow-auto border-r">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <h2 className="text-2xl font-medium">Order #{order.id}</h2>
            <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-gray-600">
            {order.status === "Accepted" 
              ? "List of goods already accepted into the warehouse"
              : "View the ordered products and, when they arrive, receive your order"}
          </p>
        </div>

        <div className="p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">SKU</th>
                <th className="py-3 px-4 text-center">Ordered</th>
                <th className="py-3 px-4 text-center">Received</th>
                <th className="py-3 px-4 text-right">Supply price, LKR</th>
                <th className="py-3 px-4 text-right">supply price, LKR</th>
                <th className="py-3 px-4 text-right">Amount, LKR</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4">{item.title}</td>
                  <td className="py-3 px-4">{item.sku || "-"}</td>
                  <td className="py-3 px-4 text-center">{item.ordered || item.quantity} pc</td>
                  <td className="py-3 px-4 text-center">{item.received || 0} pc</td>
                  <td className="py-3 px-4 text-right">
                    {item.supplyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(item.supplyPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(item.amount || (item.supplyPrice * (item.received || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="6" className="py-3 px-4 text-right font-medium">Total</td>
                <td className="py-3 px-4 text-right font-medium">
                  {order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {order.status === "Accepted" && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => onAccept(order.id)} // This will trigger the receive items flow
                variant="outline"
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Order details
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Order details */}
      <div className="w-2/5 bg-gray-50 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-medium">Order details</h2>
          <div className="flex items-center">
            <button className="text-gray-500 hover:text-gray-700 mr-3">
              ⋮
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 flex-grow overflow-auto">
          <div className="mb-6">
            <h3 className="font-medium mb-2">The supplier</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="bg-gray-600 text-white w-10 h-10 rounded-md flex items-center justify-center mr-3 font-bold">
                  A
                </div>
                <div>
                  <div className="font-medium">Abc</div>
                  <div className="text-blue-600">+94 77 009 3285</div>
                  <div className="text-gray-600">pavi@gmail.com</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Comment</h3>
            <p className="text-gray-600">
              {order.comment || "No comment"}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Created by</span>
                <span>{order.createdBy}</span>
              </div>

              {order.took && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Took</span>
                  <span>{order.took}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span>{order.created}</span>
              </div>

              {order.accepted && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Accepted</span>
                  <span>{order.accepted}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Finances</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order cost</span>
                <span>LKR {order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>LKR {order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {order.status === "Created" && (
          <div className="p-6 border-t">
            <Button
              onClick={() => onAccept(order.id)}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Accept order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;