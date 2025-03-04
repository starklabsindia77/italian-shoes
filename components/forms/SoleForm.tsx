/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, FormEvent } from "react";
import InputField from "../fields/InputField";

interface SoleFormProps {
  onSubmit?: (formData: FormData) => void; // Changed to FormData to handle file uploads
  onCancel: () => void;
  defaultValues?: { type: string; height?: string; imageFile?: string; imageUrl?: string }; // Added image fields
  mode?: "add" | "edit" | "view";
}

const SoleForm: React.FC<SoleFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState<{
    type: string;
    height: string;
    imageFile: File | null;
    imagePreview: string | null;
  }>({
    type: defaultValues?.type || "",
    height: defaultValues?.height || "",
    imageFile: null,
    imagePreview: defaultValues?.imageFile || null, // For edit/view mode existing image
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
    if (isViewMode) return true; // No validation in view mode

    const newErrors: Partial<typeof formData> = {};
    if (!formData.type) newErrors.type = "Type is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isViewMode) return; // Prevent submission in view mode
    if (validate() && onSubmit) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("type", formData.type);
      formDataToSubmit.append("height", formData.height);
      if (formData.imageFile) formDataToSubmit.append("imageFile", formData.imageFile);
      onSubmit(formDataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <InputField
          label="Type"
          value={formData.type}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, type: e.target.value })
          }
          disabled={isViewMode}
        />
        {errors.type && !isViewMode && (
          <p className="text-red-500 text-sm mt-1">{errors.type}</p>
        )}
      </div>
      <div>
        <InputField
          label="Height"
          value={formData.height}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, height: e.target.value })
          }
          disabled={isViewMode}
        />
      </div>
      <div>
        <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">
          Image
        </label>
        {formData.imagePreview && (
          <img
            src={formData.imagePreview}
            alt="Preview"
            className="mb-2 h-20 w-20 object-cover rounded"
          />
        )}
        {isViewMode && defaultValues?.imageUrl && (
          <img
            src={defaultValues?.imageUrl}
            alt="Preview"
            className="mb-2 h-20 w-20 object-cover rounded"
          />
        )}
        {!isViewMode && (
          <input
            type="file"
            name="imageFile"
            id="imageFile"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                imageFile: e.target.files ? e.target.files[0] : null,
                imagePreview: e.target.files
                  ? URL.createObjectURL(e.target.files[0])
                  : prev.imagePreview,
              }))
            }
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
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

export default SoleForm;