"use client";

import { useState, useEffect } from "react";
import InputField from "../fields/InputField";
import SelectField from "../fields/SelectField";

interface VariantFormProps {
  onSubmit?: (formData: any) => void;
  onCancel: () => void;
  defaultValues?: {
    name?: string;
    sizeOptionId?: number;
    styleOptionId?: number;
    soleOptionId?: number;
    materialId?: number;
    colorId?: number;
    panelId?: number;
  };
  mode?: "add" | "edit" | "view";
}

interface DropdownOption {
  id: number;
  name: string;
  [key: string]: any;
}

const VariantForm: React.FC<VariantFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState({
    name: defaultValues?.name || "",
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

  const [nameError, setNameError] = useState<string | undefined>(undefined);

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
    if (isViewMode) return true;

    if (!formData.name) {
      setNameError("Name is required.");
      return false;
    }
    setNameError(undefined);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode || !onSubmit) return;
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <InputField
          label="Name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, name: e.target.value })
          }
          disabled={isViewMode}
        />
        {nameError && (
          <p className="text-red-500 text-sm mt-1">{nameError}</p>
        )}
      </div>
      <div>
        <SelectField
          label="Size"
          options={dropdownData.sizes.map((size) => ({
            value: size.id,
            label: `${size.sizeSystem} - ${size.size} (${size.width || "Standard"})`,
          }))}
          value={formData.sizeOptionId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              sizeOptionId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
      </div>
      <div>
        <SelectField
          label="Style"
          options={dropdownData.styles.map((style) => ({
            value: style.id,
            label: style.name,
          }))}
          value={formData.styleOptionId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              styleOptionId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
      </div>
      <div>
        <SelectField
          label="Sole"
          options={dropdownData.soles.map((sole) => ({
            value: sole.id,
            label: `${sole.type} (${sole.height || "N/A"})`,
          }))}
          value={formData.soleOptionId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              soleOptionId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
      </div>
      <div>
        <SelectField
          label="Material"
          options={dropdownData.materials.map((material) => ({
            value: material.id,
            label: material.name,
          }))}
          value={formData.materialId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              materialId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
      </div>
      <div>
        <SelectField
          label="Color"
          options={dropdownData.colors.map((color) => ({
            value: color.id,
            label: `${color.name} (${color.hexCode})`,
          }))}
          value={formData.colorId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              colorId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
      </div>
      <div>
        <SelectField
          label="Panel"
          options={dropdownData.panels.map((panel) => ({
            value: panel.id,
            label: panel.name,
          }))}
          value={formData.panelId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              panelId: parseInt(e.target.value) || "",
            }))
          }
          disabled={isViewMode}
        />
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