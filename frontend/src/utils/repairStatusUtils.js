/**
 * Utility functions for repair status management
 */

// Define the status progression order
export const STATUS_ORDER = {
  "Pending": 0,
  "Completed": 1,
  "Cannot Repair": 2,
  "Picked Up": 3
};

// Get all available status options
export const getAllStatusOptions = () => {
  return Object.keys(STATUS_ORDER);
};

/**
 * Get valid next status options based on current status
 * @param {string} currentStatus - The current status of the repair
 * @returns {Array} - Array of valid next status options
 */
export const getValidNextStatuses = (currentStatus) => {
  if (!currentStatus || !STATUS_ORDER.hasOwnProperty(currentStatus)) {
    return getAllStatusOptions();
  }

  const currentStatusOrder = STATUS_ORDER[currentStatus];
  
  // Filter statuses that have a higher order value than the current status
  return Object.entries(STATUS_ORDER)
    .filter(([status, order]) => order > currentStatusOrder)
    .map(([status]) => status);
};

/**
 * Check if a status transition is valid (one-directional progression)
 * @param {string} currentStatus - The current status of the repair
 * @param {string} newStatus - The new status to transition to
 * @returns {boolean} - Whether the transition is valid
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  // If either status is not in our defined order, return false
  if (!STATUS_ORDER.hasOwnProperty(currentStatus) || !STATUS_ORDER.hasOwnProperty(newStatus)) {
    return false;
  }

  // Get the order values
  const currentOrder = STATUS_ORDER[currentStatus];
  const newOrder = STATUS_ORDER[newStatus];

  // Valid transition if new status has a higher order value
  return newOrder > currentOrder;
};

/**
 * Get a human-readable explanation of why a status transition is invalid
 * @param {string} currentStatus - The current status of the repair
 * @param {string} newStatus - The new status to transition to
 * @returns {string} - Explanation message
 */
export const getInvalidTransitionMessage = (currentStatus, newStatus) => {
  if (!STATUS_ORDER.hasOwnProperty(currentStatus)) {
    return `Current status "${currentStatus}" is not recognized.`;
  }
  
  if (!STATUS_ORDER.hasOwnProperty(newStatus)) {
    return `New status "${newStatus}" is not recognized.`;
  }
  
  const currentOrder = STATUS_ORDER[currentStatus];
  const newOrder = STATUS_ORDER[newStatus];
  
  if (newOrder <= currentOrder) {
    return `Cannot change status from "${currentStatus}" to "${newStatus}". Status can only progress forward, not backward.`;
  }
  
  return ""; // No error message if transition is valid
};
