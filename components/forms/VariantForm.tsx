"use client";

import { useState, useEffect } from "react";
import SelectField from "../fields/SelectField"; // Assume SelectField is a reusable dropdown component

interface VariantFormProps {
  onSubmit?: (formData: any) => void; // Optional in view mode
  onCancel: () => void;
  defaultValues?: {
    sizeOptionId?: number;
    styleOptionId?: number;
    soleOptionId?: number;
    materialId?: number;
    colorId?: number;
    panelId?: number;
  }; // For edit/view case
  mode?: "add" | "edit" | "view"; // Determines form behavior
}

interface DropdownOption {
  id: number;
  name: string;
  [key: string]: any; // To handle additional properties like `size`, `type`, etc.
}

const VariantForm: React.FC<VariantFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState<{
    sizeOptionId: number | "";
    styleOptionId: number | "";
    soleOptionId: number | "";
    materialId: number | "";
    colorId: number | "";
    panelId: number | "";
  }>({
    sizeOptionId: defaultValues?.sizeOptionId || "",
    styleOptionId: defaultValues?.styleOptionId || "",
    soleOptionId: defaultValues?.soleOptionId || "",
    materialId: defaultValues?.materialId || "",
    colorId: defaultValues?.colorId || "",
    panelId: defaultValues?.panelId || "",
  });

  const [dropdownData, setDropdownData] = useState<{
    sizes: DropdownOption[];
    styles: DropdownOption[];
    soles: DropdownOption[];
    materials: DropdownOption[];
    colors: DropdownOption[];
    panels: DropdownOption[];
  }>({
    sizes: [],
    styles: [],
    soles: [],
    materials: [],
    colors: [],
    panels: [],
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  // Fetch dropdown data from the API
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await fetch("/api/variant-form");
        if (!response.ok) throw new Error("Failed to fetch form data");
        const { data } = await response.json();
        setDropdownData({
          sizes: data.sizes || [],
          styles: data.styles || [],
          soles: data.soles || [],
          materials: data.materials || [],
          colors: data.colors || [],
          panels: data.panels || [],
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const validate = (): boolean => {
    if (isViewMode) return true; // Skip validation in view mode
  
    const newErrors: { [key: string]: string | undefined } = {};
    
    if (!formData.sizeOptionId) newErrors.sizeOptionId = "Size is required.";
    if (!formData.styleOptionId) newErrors.styleOptionId = "Style is required.";
    if (!formData.soleOptionId) newErrors.soleOptionId = "Sole is required.";
    if (!formData.materialId) newErrors.materialId = "Material is required.";
    if (!formData.colorId) newErrors.colorId = "Color is required.";
    if (!formData.panelId) newErrors.panelId = "Panel is required.";
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    if (validate() && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <SelectField
          label="Size"
          options={dropdownData.sizes.map((size) => ({
            value: size.id,
            label: `${size.sizeSystem} - ${size.size} (${size.width || "Standard"})`,
          }))}
          value={formData.sizeOptionId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              sizeOptionId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
        {errors.sizeOptionId && (
          <p className="text-red-500 text-sm mt-1">{errors.sizeOptionId}</p>
        )}
      </div>
      <div>
        <SelectField
          label="Style"
          options={dropdownData.styles.map((style) => ({
            value: style.id,
            label: style.name,
          }))}
          value={formData.styleOptionId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              styleOptionId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
        {errors.styleOptionId && (
          <p className="text-red-500 text-sm mt-1">{errors.styleOptionId}</p>
        )}
      </div>
      <div>
        <SelectField
          label="Sole"
          options={dropdownData.soles.map((sole) => ({
            value: sole.id,
            label: `${sole.type} (${sole.height || "N/A"})`,
          }))}
          value={formData.soleOptionId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              soleOptionId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
        {errors.soleOptionId && (
          <p className="text-red-500 text-sm mt-1">{errors.soleOptionId}</p>
        )}
      </div>
      <div>
        <SelectField
          label="Material"
          options={dropdownData.materials.map((material) => ({
            value: material.id,
            label: material.name,
          }))}
          value={formData.materialId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              materialId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
        {errors.materialId && (
          <p className="text-red-500 text-sm mt-1">{errors.materialId}</p>
        )}
      </div>
      <div>
        <SelectField
          label="Color"
          options={dropdownData.colors.map((color) => ({
            value: color.id,
            label: `${color.name} (${color.hexCode})`,
          }))}
          value={formData.colorId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              colorId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
        {errors.colorId && (
          <p className="text-red-500 text-sm mt-1">{errors.colorId}</p>
        )}
      </div>
      <div>
        <SelectField
          label="Panel"
          options={dropdownData.panels.map((panel) => ({
            value: panel.id,
            label: panel.name,
          }))}
          value={formData.panelId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              panelId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
        {errors.panelId && (
          <p className="text-red-500 text-sm mt-1">{errors.panelId}</p>
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

export default VariantForm;
