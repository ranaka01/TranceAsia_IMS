/**
 * Utility functions for date formatting
 */

/**
 * Format a date string to YYYY/MM/DD format
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date string
 */
export const formatDeadlineDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return "";
    }
    
    // Format as YYYY/MM/DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return "";
  }
};

/**
 * Format a date string to a more readable format (Month DD, YYYY)
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date string
 */
export const formatFullDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return "";
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return "";
  }
};
