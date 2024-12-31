"use client";

import { useState, FormEvent } from "react";
import InputField from "../fields/InputField";

interface SizeFormProps {
  onSubmit?: (formData: any) => void;
  onCancel: () => void;
  defaultValues?: { sizeSystem: string; size: string; width?: string };
  mode?: "add" | "edit" | "view";
}

const SizeForm: React.FC<SizeFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState({
    sizeSystem: defaultValues?.sizeSystem || "",
    size: defaultValues?.size || "",
    width: defaultValues?.width || "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Size System"
        value={formData.sizeSystem}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sizeSystem: e.target.value })}
        disabled={isViewMode}
      />
      <InputField
        label="Size"
        value={formData.size}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, size: e.target.value })}
        disabled={isViewMode}
      />
      <InputField
        label="Width"
        value={formData.width}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, width: e.target.value })}
        disabled={isViewMode}
      />
      <div className="flex justify-end space-x-2">
        {isViewMode ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Back
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {mode === "edit" ? "Update" : "Submit"}
            </button>
          </>
        )}
      </div>
    </form>
  );
};

export default SizeForm;
