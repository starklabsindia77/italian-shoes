/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, FormEvent } from "react";
import InputField from "../fields/InputField";

interface ColorFormProps {
  onSubmit?: (formData: FormData) => void; // Optional in view mode
  onCancel: () => void;
  defaultValues?: { name: string; hexCode: string; imageFile?: string; imageUrl?: string }; // For edit/view case
  mode?: "add" | "edit" | "view"; // Determines form behavior
}

const ColorForm: React.FC<ColorFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState<{
    name: string;
    hexCode: string;
    imageFile: File | null;
    imagePreview: string | null; // For displaying the existing image in edit/view mode
  }>({
    name: defaultValues?.name || "",
    hexCode: defaultValues?.hexCode || "",
    imageFile: null,
    imagePreview: defaultValues?.imageFile || null,
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
    if (isViewMode) return true; // No validation in view mode

    const newErrors: Partial<typeof formData> = {};
    if (!formData.name) newErrors.name = "Name is required.";
    if (!formData.hexCode) newErrors.hexCode = "Hex code is required.";
    else if (!/^#([0-9A-F]{3}){1,2}$/i.test(formData.hexCode))
      newErrors.hexCode = "Invalid hex code format.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isViewMode) return; // Prevent submission in view mode
    if (validate() && onSubmit) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("hexCode", formData.hexCode);
      if (formData.imageFile) formDataToSubmit.append("imageFile", formData.imageFile);
      onSubmit(formDataToSubmit);
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
          placeholder="Enter color name"
          disabled={isViewMode} // Disable input in view mode
        />
        {errors.name && !isViewMode && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      <div>
        <InputField
          label="Hex Code"
          id="hexCode"
          type="text"
          value={formData.hexCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, hexCode: e.target.value }))
          }
          placeholder="#FFFFFF"
          disabled={isViewMode} // Disable input in view mode
        />
        {errors.hexCode && !isViewMode && (
          <p className="text-red-500 text-sm mt-1">{errors.hexCode}</p>
        )}
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

export default ColorForm;
