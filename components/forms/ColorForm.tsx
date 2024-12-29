"use client";

import { useState, ChangeEvent, FormEvent, SetStateAction } from "react";
import InputField from "../fields/InputField";

interface ColorFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

const ColorForm: React.FC<ColorFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    name: string;
    hexCode: string;
    imageFile: File | null;
  }>({
    name: "",
    hexCode: "",
    imageFile: null,
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
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
    if (validate()) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("hexCode", formData.hexCode);
      if (formData.imageFile)
        formDataToSubmit.append("imageFile", formData.imageFile);
      onSubmit(formDataToSubmit);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "imageFile" ? files?.[0] || null : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <InputField
          label="Name"
          id="name"
          //name="name"
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter color name"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      <div>
        <InputField
          label="Hex Code"
          id="hexCode"
          // name="hexCode"
          type="text"
          value={formData.hexCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, hexCode: e.target.value }))
          }
          placeholder="#FFFFFF"
        />
        {errors.hexCode && (
          <p className="text-red-500 text-sm mt-1">{errors.hexCode}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="imageFile"
          className="block text-sm font-medium text-gray-700"
        >
          Upload Image
        </label>
        {/* <input
          type="file"
          name="imageFile"
          id="imageFile"
          accept="image/*"
          // onChange={handleChange}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFormData((prev) => ({ ...prev, imageFile: e.target.value }))
          } 
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        /> */}
        <input
          type="file"
          name="imageFile"
          id="imageFile"
          accept="image/*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              imageFile: e.target.files ? e.target.files[0] : null, // Ensure we access the first file if files exist
            }))
          }
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div className="flex justify-end space-x-2">
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
          Submit
        </button>
      </div>
    </form>
  );
};

export default ColorForm;
