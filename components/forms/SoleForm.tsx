"use client";

import { useState, FormEvent } from "react";
import InputField from "../fields/InputField";

interface SoleFormProps {
  onSubmit?: (formData: any) => void;
  onCancel: () => void;
  defaultValues?: { type: string; height?: string };
  mode?: "add" | "edit" | "view";
}

const SoleForm: React.FC<SoleFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState({
    type: defaultValues?.type || "",
    height: defaultValues?.height || "",
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
        label="Type"
        value={formData.type}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, type: e.target.value })}
        disabled={isViewMode}
      />
      <InputField
        label="Height"
        value={formData.height}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, height: e.target.value })}
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

export default SoleForm;
