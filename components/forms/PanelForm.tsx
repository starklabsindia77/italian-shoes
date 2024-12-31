"use client";

import { useState, FormEvent } from "react";
import InputField from "../fields/InputField";

interface PanelFormProps {
  onSubmit?: (formData: any) => void; // Optional in view mode
  onCancel: () => void;
  defaultValues?: { name: string; description: string }; // For edit/view case
  mode?: "add" | "edit" | "view"; // Determines form behavior
}

const PanelForm: React.FC<PanelFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: defaultValues?.name || "",
    description: defaultValues?.description || "",
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
    if (isViewMode) return true; // No validation in view mode

    const newErrors: Partial<typeof formData> = {};
    if (!formData.name) newErrors.name = "Name is required.";
    if (!formData.description) newErrors.description = "Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isViewMode) return; // Prevent submission in view mode
    if (validate() && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <InputField
          label="Name"
          id="name"
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter panel name"
          disabled={isViewMode} // Disable input in view mode
        />
        {errors.name && !isViewMode && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      <div>
        <InputField
          label="Description"
          id="description"
          type="text"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter panel description"
          disabled={isViewMode} // Disable input in view mode
        />
        {errors.description && !isViewMode && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>
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

export default PanelForm;
