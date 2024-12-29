"use client";

import { useState, ChangeEvent, FormEvent } from "react";

interface ColorFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

const ColorForm: React.FC<ColorFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{ name: string; hexCode: string; imageFile: File | null }>({
    name: "",
    hexCode: "",
    imageFile: null,
  });
  const [errors, setErrors] = useState<{ name: string; hexCode: string; imageFile: string }>({
    name: "",
    hexCode: "",
    imageFile: "",
  });

  const validate = (): boolean => {
    let isValid = true;
    const newErrors = { name: "", hexCode: "", imageFile: "" };

    if (!formData.name) {
      newErrors.name = "Name is required.";
      isValid = false;
    }

    if (!formData.hexCode) {
      newErrors.hexCode = "Hex code is required.";
      isValid = false;
    } else if (!/^#([0-9A-F]{3}){1,2}$/i.test(formData.hexCode)) {
      newErrors.hexCode = "Invalid hex code format.";
      isValid = false;
    }

    if (!formData.imageFile) {
      newErrors.imageFile = "Image file is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("hexCode", formData.hexCode);
      if (formData.imageFile) {
        formDataToSubmit.append("imageFile", formData.imageFile);
      }
      onSubmit(formDataToSubmit);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "imageFile" && files) {
      setFormData({ ...formData, imageFile: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="hexCode" className="block text-sm font-medium text-gray-700">
          Hex Code
        </label>
        <input
          type="text"
          name="hexCode"
          id="hexCode"
          value={formData.hexCode}
          onChange={handleChange}
          placeholder="#FFFFFF"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.hexCode && <p className="text-red-500 text-sm mt-1">{errors.hexCode}</p>}
      </div>

      <div>
        <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">
          Upload Image
        </label>
        <input
          type="file"
          name="imageFile"
          id="imageFile"
          accept="image/*"
          onChange={handleChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {errors.imageFile && <p className="text-red-500 text-sm mt-1">{errors.imageFile}</p>}
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
