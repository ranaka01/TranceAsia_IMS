import React, { useState, useEffect } from "react";
import Button from "./Button";
import SearchInput from "../../components/UI/NewSearchInput";
import CreateOrderModal from "./CreateOrderModal";
import ViewOrderModal from "./ViewOrderModal";
import ReceiveOrderModal from "./ReceiveOrderModal";

const OrderManagement = () => {
  // Modified order statuses (removed ACCEPTED)
  const ORDER_STATUS = {
    PENDING: "Pending",
    PARTIALLY_RECEIVED: "Partially Received",
    FULLY_RECEIVED: "Fully Received",
    CANCELLED: "Cancelled"
  };

  // Updated sample orders data with time information
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      supplierId: "2011",
      supplierName: "Selix Computers",
      dateCreated: "2025-04-01",
      timeCreated: "14:30:22",
      status: ORDER_STATUS.PENDING, 
      items: [
        { id: "P001", name: "Dell Laptop XPS 13", quantity: 5, unitPrice: 150000, received: 0 },
        { id: "P002", name: "HP Printer", quantity: 3, unitPrice: 45000, received: 0 }
      ],
      notes: "Regular monthly order"
    },
    {
      id: "ORD-002",
      supplierId: "2012",
      supplierName: "Tech Solutions",
      dateCreated: "2025-04-10",
      timeCreated: "09:15:45",
      status: ORDER_STATUS.PENDING,
      items: [
        { id: "P003", name: "Gaming Mouse", quantity: 10, unitPrice: 3500, received: 0 },
        { id: "P004", name: "Mechanical Keyboard", quantity: 8, unitPrice: 7500, received: 0 }
      ],
      notes: "Seasonal stock replenishment"
    },
    {
      id: "ORD-003",
      supplierId: "2013",
      supplierName: "Digital World",
      dateCreated: "2025-04-15",
      timeCreated: "16:20:33",
      status: ORDER_STATUS.PARTIALLY_RECEIVED,
      items: [
        { id: "P005", name: "USB Flash Drive 64GB", quantity: 20, unitPrice: 1500, received: 15 },
        { id: "P006", name: "External HDD 1TB", quantity: 5, unitPrice: 12000, received: 3 }
      ],
      notes: "Urgent order for promotion"
    }
  ]);

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Initialize filtered orders
  useEffect(() => {
    setFilteredOrders([...orders]);
  }, [orders]);

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders([...orders]);
    } else {
      const filtered = orders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [orders, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    // Explicit search functionality if needed
  };

  const handleCreateOrder = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSaveOrder = (orderData) => {
    // Generate a new order ID
    const newId = `ORD-${(orders.length + 1).toString().padStart(3, '0')}`;
    
    // Get current date and time
    const now = new Date();
    const dateCreated = now.toISOString().split('T')[0];
    const timeCreated = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS
    
    const newOrder = {
      id: newId,
      dateCreated,
      timeCreated,
      status: ORDER_STATUS.PENDING,
      ...orderData,
      // Initialize received quantity to zero for each item
      items: orderData.items.map(item => ({
        ...item,
        received: 0
      }))
    };

    setOrders([...orders, newOrder]);
    setIsCreateModalOpen(false);
  };

  const handleViewOrder = (order) => {
    setCurrentOrder(order);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setCurrentOrder(null);
  };

  // Modified to directly open receive modal for pending orders
  const handleReceiveOrder = (order) => {
    if (order.status === ORDER_STATUS.PENDING || 
        order.status === ORDER_STATUS.PARTIALLY_RECEIVED) {
      setCurrentOrder(order);
      setIsReceiveModalOpen(true);
    } else if (order.status === ORDER_STATUS.FULLY_RECEIVED) {
      alert("This order has already been fully received.");
    } else {
      alert("Cannot receive a cancelled order.");
    }
  };

  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    setCurrentOrder(null);
  };

  // Removed handleAcceptOrder function since we're skipping the "Accepted" status

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: ORDER_STATUS.CANCELLED } 
          : order
      );
      setOrders(updatedOrders);
    }
  };

  const handleReceiveItems = (orderId, receivedItems) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        // Update received quantities
        const updatedItems = order.items.map(item => {
          const receivedItem = receivedItems.find(ri => ri.id === item.id);
          return {
            ...item,
            received: (item.received || 0) + (receivedItem?.receivedQuantity || 0),
            // Store actual received price if different
            actualPrice: receivedItem?.actualPrice || item.unitPrice
          };
        });

        // Determine if all items are fully received
        const isFullyReceived = updatedItems.every(item => item.received >= item.quantity);
        
        return {
          ...order,
          items: updatedItems,
          status: isFullyReceived 
            ? ORDER_STATUS.FULLY_RECEIVED 
            : ORDER_STATUS.PARTIALLY_RECEIVED,
          receiptHistory: [
            ...(order.receiptHistory || []),
            {
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().split(' ')[0],
              items: receivedItems
            }
          ]
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    setIsReceiveModalOpen(false);
    setCurrentOrder(null);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Order Management</h1>
      </div>

      <div className="mb-4 flex">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by order ID, supplier or status"
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Orders table with scrollable container */}
      <div className="flex-1 overflow-auto mb-16">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="py-3 px-4 text-left">Supplier</th>
              <th className="py-3 px-4 text-left">Date Created</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Total Items</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{order.id}</td>
                  <td className="py-3 px-4">{order.supplierName}</td>
                  <td className="py-3 px-4">
                    <div>{order.dateCreated}</div>
                    <div className="text-xs text-gray-500">{order.timeCreated}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === ORDER_STATUS.PENDING
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === ORDER_STATUS.PARTIALLY_RECEIVED
                          ? "bg-purple-100 text-purple-800"
                          : order.status === ORDER_STATUS.FULLY_RECEIVED
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{order.items.length}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Order Details"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>

                      {order.status === ORDER_STATUS.PENDING && (
                        <button
                          onClick={() => handleReceiveOrder(order)} // Modified to directly open receive modal
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Receive Items"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                      )}

                      {order.status === ORDER_STATUS.PARTIALLY_RECEIVED && (
                        <button
                          onClick={() => handleReceiveOrder(order)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Receive More Items"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4"
                            />
                          </svg>
                        </button>
                      )}

                      {order.status === ORDER_STATUS.PENDING && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Cancel Order"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                  No orders found matching your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Order button */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleCreateOrder}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
        >
          Create Order
        </Button>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSave={handleSaveOrder}
        />
      )}

      {/* View Order Modal */}
      {isViewModalOpen && currentOrder && (
        <ViewOrderModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          order={currentOrder}
        />
      )}

      {/* Receive Order Modal */}
      {isReceiveModalOpen && currentOrder && (
        <ReceiveOrderModal
          isOpen={isReceiveModalOpen}
          onClose={handleCloseReceiveModal}
          order={currentOrder}
          onReceive={(receivedItems) => handleReceiveItems(currentOrder.id, receivedItems)}
        />
      )}
    </div>
  );
};

export default OrderManagement;