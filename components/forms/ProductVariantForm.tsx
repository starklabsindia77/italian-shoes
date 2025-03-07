"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import InputField from "../fields/InputField";
import SelectField from "../fields/SelectField";
import { useDropzone } from "react-dropzone";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const Editor = dynamic(() => import('react-draft-wysiwyg').then((mod) => mod.Editor), { ssr: false });

interface ProductVariantFormProps {
  onSubmit?: (formData: FormData) => void;
  onCancel: () => void;
  defaultValues?: {
    shopifyProductId?: number;
    variantId?: number;
    title?: string;
    description?: string;
    price?: number;
    inventoryQuantity?: number;
    seoMetadata?: { title?: string; description?: string; keywords?: string };
    images?: { url: string }[];
  };
  mode?: "add" | "edit" | "view";
}

interface DropdownOption { id: number; name: string; [key: string]: any; }

const ImageDropzone: React.FC<{
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  existingImages?: { url: string }[];
}> = ({ images, setImages, existingImages = [] }) => {
  const onDrop = (acceptedFiles: File[]) => setImages((prev) => [...prev, ...acceptedFiles]);
  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const handleRemoveImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="mt-4">
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 rounded cursor-pointer text-center dark:text-white">
        <input {...getInputProps()} />
        <p>Drag and drop images here, or click to select files</p>
      </div>
      {existingImages?.length > 0 && (
        <div className="mt-4 space-y-2">
          {existingImages.map((img, index) => (
            <div key={index} className="flex items-center border p-2 rounded dark:text-white">
              <p className="text-sm truncate">{img.url}</p>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div className="mt-4 space-y-2">
          {images.map((file, index) => (
            <div key={index} className="flex items-center justify-between border p-2 rounded dark:text-white">
              <p className="text-sm truncate">{file.name}</p>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="px-2 py-1 text-sm text-red-500 bg-gray-200 rounded hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductVariantForm: React.FC<ProductVariantFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  mode = "add",
}) => {
  const isViewMode = mode === "view";


  const [formData, setFormData] = useState({
    shopifyProductId: defaultValues?.shopifyProductId || "",
    variantId: defaultValues?.variantId || "",
    title: defaultValues?.title || "",
    description: defaultValues?.description
      ? EditorState.createWithContent(convertFromRaw(JSON.parse(defaultValues.description)))
      : EditorState.createEmpty(),
    price: defaultValues?.price || "",
    inventoryQuantity: defaultValues?.inventoryQuantity || "",
    seoMetadata: {
      title: defaultValues?.seoMetadata?.title || "",
      description: defaultValues?.seoMetadata?.description || "",
      keywords: defaultValues?.seoMetadata?.keywords || "",
    },
  });

  const [images, setImages] = useState<File[]>([]);
  const [dropdownData, setDropdownData] = useState<{ shopifyProducts: DropdownOption[]; variants: DropdownOption[] }>({
    shopifyProducts: [],
    variants: [],
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await fetch(`/api/product-variant-form`);
        if (!response.ok) throw new Error("Failed to fetch form data");
        const { data } = await response.json();
        setDropdownData({
          shopifyProducts: data.shopifyProducts || [],
          variants: data.variants || [],
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const validate = (): boolean => {
    if (isViewMode) return true;
    const newErrors: Partial<typeof formData> = {};
    if (!formData.shopifyProductId) newErrors.shopifyProductId = "Shopify Product is required.";
    if (!formData.variantId) newErrors.variantId = "Variant is required.";
    if (!formData.title) newErrors.title = "Title is required.";
    if (!formData.price) newErrors.price = "Price is required.";
    if (!formData.inventoryQuantity) newErrors.inventoryQuantity = "Inventory Quantity is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode || !onSubmit) return;

    if (validate()) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("shopifyProductId", String(formData.shopifyProductId));
      formDataToSubmit.append("variantId", String(formData.variantId));
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("description", JSON.stringify(convertToRaw(formData.description.getCurrentContent())));
      formDataToSubmit.append("price", String(formData.price));
      formDataToSubmit.append("inventoryQuantity", String(formData.inventoryQuantity));
      if (formData.seoMetadata) {
        formDataToSubmit.append("seoMetadata[title]", formData.seoMetadata.title);
        formDataToSubmit.append("seoMetadata[description]", formData.seoMetadata.description);
        formDataToSubmit.append("seoMetadata[keywords]", formData.seoMetadata.keywords);
      }
      images.forEach((image, index) => formDataToSubmit.append(`images[${index}]`, image));
      onSubmit(formDataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <InputField
            label="Title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            disabled={isViewMode}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>
        <fieldset className="border border-gray-300 p-4 rounded dark:text-white">
          <legend className="text-sm font-semibold dark:text-white">Description</legend>
          <Editor
            editorState={formData.description}
            onEditorStateChange={(editorState) =>
              setFormData((prev) => ({ ...prev, description: editorState }))
            }
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
            editorClassName="editorClassName"
            readOnly={isViewMode}
          />
        </fieldset>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SelectField
            label="Shopify Product"
            options={dropdownData.shopifyProducts.map((product) => ({
              value: product.id,
              label: product.title,
            }))}
            value={formData.shopifyProductId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFormData((prev) => ({ ...prev, shopifyProductId: parseInt(e.target.value) || "" }))
            }
            disabled={isViewMode}
          />
          {errors.shopifyProductId && <p className="text-red-500 text-sm mt-1">{errors.shopifyProductId}</p>}
        </div>
        <div>
          <SelectField
            label="Variant"
            options={dropdownData.variants.map((variant) => ({
              value: variant.id,
              label: variant.name,
            }))}
            value={formData.variantId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFormData((prev) => ({ ...prev, variantId: parseInt(e.target.value) || "" }))
            }
            disabled={isViewMode}
          />
          {errors.variantId && <p className="text-red-500 text-sm mt-1">{errors.variantId}</p>}
        </div>
        <div>
          <InputField
            label="Price"
            type="number"
            value={formData.price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || "" }))
            }
            disabled={isViewMode}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>
        <div>
          <InputField
            label="Inventory Quantity"
            type="number"
            value={formData.inventoryQuantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, inventoryQuantity: parseInt(e.target.value) || "" }))
            }
            disabled={isViewMode}
          />
          {errors.inventoryQuantity && <p className="text-red-500 text-sm mt-1">{errors.inventoryQuantity}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset className="border border-gray-300 p-4 rounded">
          <legend className="text-sm font-semibold dark:text-white">SEO Metadata</legend>
          <div>
            <InputField
              label="SEO Title"
              value={formData.seoMetadata.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  seoMetadata: { ...prev.seoMetadata, title: e.target.value },
                }))
              }
              disabled={isViewMode}
            />
          </div>
          <div>
            <InputField
              label="SEO Description"
              value={formData.seoMetadata.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  seoMetadata: { ...prev.seoMetadata, description: e.target.value },
                }))
              }
              disabled={isViewMode}
            />
          </div>
          <div>
            <InputField
              label="SEO Keywords"
              value={formData.seoMetadata.keywords}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  seoMetadata: { ...prev.seoMetadata, keywords: e.target.value },
                }))
              }
              disabled={isViewMode}
            />
          </div>
        </fieldset>
        <ImageDropzone images={images} setImages={setImages} existingImages={defaultValues?.images} />
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

export default ProductVariantForm;