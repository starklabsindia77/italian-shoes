import React from "react";

interface SelectFieldProps {
  label: string;
  id?: string;
  name?: string;
  value: string | number | undefined; // Ensure value matches allowed types
  options: { value: string | number; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string; // Validation error message
  extraClass?: string; // Additional styling if required
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  name,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select an option",
  error,
  extraClass = "",
}) => {
  return (
    <div className={`space-y-1 ${extraClass}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value ?? ""} // Ensure value is either a valid option or empty string
        onChange={onChange}
        disabled={disabled}
        className={`block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "text-gray-700"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SelectField;
