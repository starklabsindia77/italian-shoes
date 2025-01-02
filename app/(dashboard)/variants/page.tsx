"use client";

import { useState, useCallback, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import VariantForm from "@/components/forms/VariantForm";

const VariantListPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteVariantId, setDeleteVariantId] = useState<number | null>(null);

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
    { Header: "Name", accessor: "name" },
    { Header: "Size", accessor: "size.sizeSystem" },
    { Header: "Style", accessor: "style.name" },
    { Header: "Sole", accessor: "sole.type" },
    { Header: "Material", accessor: "material.name" },
    { Header: "Color", accessor: "color.name" },
    { Header: "Panel", accessor: "panel.name" },
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

  const fetchVariants = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/variants?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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
          throw new Error(errorData.message || "Failed to fetch variants");
        }
        const data = await response.json();
        setTableData(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Variants loaded successfully!");
        return data;
      } catch (error: any) {
        toast.error(`Failed to fetch variants: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(async () => {
    await fetchVariants({ page: 1, pageSize: 10 });
  }, [fetchVariants]);

  const handleAddVariant = async (variantData: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/variants", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add variant");
      }

      toast.success("Variant added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to add variant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVariant = async (variantData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/variants?id=${String(selectedVariant.id)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update variant");
      }

      toast.success("Variant updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to update variant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteVariantId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/variants?id=${String(deleteVariantId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete variant");
      }

      toast.success("Variant deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete variant: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteVariantId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteVariantId(id);
    setDeleteModalOpen(true);
  };

  const handleView = (variant: any) => {
    setSelectedVariant(variant);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (variant: any) => {
    setSelectedVariant(variant);
    setModalMode("edit");
    setModalOpen(true);
  };

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {/* Variant List */}
        </h1>
        <button
          onClick={() => {
            setSelectedVariant(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Variant
        </button>
      </div>

      <CheckTable
        columnsData={columnsData}
        fetchData={fetchVariants}
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
            <p>Are you sure you want to delete this variant? This action cannot be undone.</p>
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
              ? "Add New Variant"
              : modalMode === "edit"
              ? "Edit Variant"
              : "View Variant"
          }
        >
          <VariantForm
            onSubmit={modalMode === "edit" ? handleEditVariant : handleAddVariant}
            onCancel={() => setModalOpen(false)}
            defaultValues={selectedVariant}
            mode={modalMode}
          />
        </Modal>
      )}
    </div>
  );
};

export default VariantListPage;
