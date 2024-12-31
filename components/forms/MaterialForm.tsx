"use client";

import { useState, FormEvent } from "react";
import InputField from "../fields/InputField";

interface MaterialFormProps {
  onSubmit?: (formData: any) => void;
  onCancel: () => void;
  defaultValues?: { name: string; description: string };
  mode?: "add" | "edit" | "view";
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState({
    name: defaultValues?.name || "",
    description: defaultValues?.description || "",
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
        label="Name"
        value={formData.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
        disabled={isViewMode}
      />
      <InputField
        label="Description"
        value={formData.description}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
        disabled={isViewMode}
      />
      {/* {!isViewMode && (
        <button type="submit">{mode === "edit" ? "Update" : "Submit"}</button>
      )}
      <button type="button" onClick={onCancel}>
        {isViewMode ? "Back" : "Cancel"}
      </button> */}
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

export default MaterialForm;
