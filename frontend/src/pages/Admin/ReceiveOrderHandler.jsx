import React, { useState } from "react";
import OrderDetailsModal from "./OrderDetailsModal";
import ReceiveOrderModal from "./ReceiveOrderModal";

// This is a handler component to manage the flow between order details and receiving items
const ReceiveOrderHandler = ({ isOpen, onClose, order, onAccept, onReceiveItems }) => {
  const [currentStep, setCurrentStep] = useState("details"); // "details" or "receive"
  const [updatedOrder, setUpdatedOrder] = useState(null);

  // Handle accepting an order
  const handleAcceptOrder = (orderId) => {
    // If the order is already accepted, go to receive items step
    if (order.status === "Accepted") {
      setCurrentStep("receive");
    } else {
      // Otherwise, call the onAccept function to change status to Accepted
      onAccept(orderId);
      // Close the modal
      onClose();
    }
  };

  // Handle receiving items from an order
  const handleReceiveItems = (receivedData) => {
    // Process received items
    onReceiveItems(receivedData);
    // Update the local order with received items
    setUpdatedOrder({
      ...order,
      status: "Accepted",
      items: receivedData.items
    });
    // Go back to details view to show the updated order
    setCurrentStep("details");
  };

  // Handle closing the modal
  const handleClose = () => {
    setCurrentStep("details");
    onClose();
  };

  // Render the appropriate modal based on the current step
  if (!isOpen) return null;

  if (currentStep === "receive") {
    return (
      <ReceiveOrderModal 
        isOpen={isOpen}
        onClose={handleClose}
        order={updatedOrder || order}
        onReceiveOrder={handleReceiveItems}
      />
    );
  }

  return (
    <OrderDetailsModal
      isOpen={isOpen}
      onClose={handleClose}
      order={updatedOrder || order}
      onAccept={handleAcceptOrder}
    />
  );
};

export default ReceiveOrderHandler;