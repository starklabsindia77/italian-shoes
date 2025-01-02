"use client";

import { useState, useCallback, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import ProductVariantForm from "@/components/forms/ProductVariantForm";

const ProductVariantListPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteProductVariantId, setDeleteProductVariantId] = useState<number | null>(null);

  const [token] = useState<string>(() => {
    const userData = Cookies.get("auth_token");
    if (userData) {
      try {
        return JSON.parse(userData).value || "";
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
    return "";
  });

  const columnsData = [
    { Header: "ID", accessor: "id" },
    { Header: "Product", accessor: "shopifyProduct.title" },
    { Header: "Variant", accessor: "variant.name" },
    { Header: "Price", accessor: "price" },
    { Header: "Inventory", accessor: "inventoryQuantity" },
    { Header: "DATE", accessor: "createdAt" },
    {
      Header: "ACTIONS",
      Cell: ({ row }: { row: any }) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="px-2 py-1 text-white text-sm rounded"
          >
            <FiEye size={16} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="px-2 py-1 text-white text-sm rounded"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => confirmDelete(row.id)}
            className="px-2 py-1 text-white text-sm rounded"
          >
            <FiTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  const fetchProductVariants = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/product-variants?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch product variants");
        }
        const data = await response.json();
        setTableData(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Product variants loaded successfully!");
        return data;
      } catch (error: any) {
        toast.error(`Failed to fetch product variants: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(async () => {
    await fetchProductVariants({ page: 1, pageSize: 10 });
  }, [fetchProductVariants]);

  const handleAddProductVariant = async (variantData: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/product-variants", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: variantData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add product variant");
      }

      toast.success("Product variant added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to add product variant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductVariant = async (variantData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/product-variants?id=${String(selectedProductVariant.id)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product variant");
      }

      toast.success("Product variant updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to update product variant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProductVariantId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/product-variants?id=${String(deleteProductVariantId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product variant");
      }

      toast.success("Product variant deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete product variant: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteProductVariantId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteProductVariantId(id);
    setDeleteModalOpen(true);
  };

  const handleView = (variant: any) => {
    setSelectedProductVariant(variant);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (variant: any) => {
    setSelectedProductVariant(variant);
    setModalMode("edit");
    setModalOpen(true);
  };

  useEffect(() => {
    fetchProductVariants();
  }, [fetchProductVariants]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {/* Product Variant List */}
        </h1>
        <button
          onClick={() => {
            setSelectedProductVariant(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Product Variant
        </button>
      </div>

      <CheckTable
        columnsData={columnsData}
        fetchData={fetchProductVariants}
        showIcons={true}
        showSync={false}
        actions={{
          onRefresh: handleRefresh,
        }}
      />

      {isDeleteModalOpen && (
        <Modal
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Delete"
        >
          <div className="p-4 dark:text-white">
            <p>Are you sure you want to delete this product variant? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isModalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          title={
            modalMode === "add"
              ? "Add New Product Variant"
              : modalMode === "edit"
              ? "Edit Product Variant"
              : "View Product Variant"
          }
          width="w-2/3"
          scrollable={true}
        >
          <ProductVariantForm
            onSubmit={
              modalMode === "edit" ? handleEditProductVariant : handleAddProductVariant
            }
            onCancel={() => setModalOpen(false)}
            defaultValues={selectedProductVariant}
            mode={modalMode}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductVariantListPage;
