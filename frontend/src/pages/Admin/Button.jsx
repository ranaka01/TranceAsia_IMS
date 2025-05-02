import React from "react";

/**
 * Button component with different variants
 * @param {Object} props
 * @param {string} [props.variant="primary"] - Button variant (primary, secondary, danger)
 * @param {string} [props.size="md"] - Button size (sm, md, lg)
 * @param {string} [props.type="button"] - Button type (button, submit, reset)
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {Function} [props.onClick] - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS classes
 */
const Button = ({
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  children,
  className = "",
  ...rest
}) => {
  // Base classes for all buttons
  let baseClasses = "font-medium rounded-md transition-colors focus:outline-none";

  // Size specific classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-2.5 text-lg",
  };

  // Variant specific classes
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
  };

  // Disabled classes
  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  // Combine all classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
    variantClasses[variant] || variantClasses.primary
  } ${disabledClasses} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;