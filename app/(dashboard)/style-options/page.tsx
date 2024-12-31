"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import StyleForm from "@/components/forms/StyleForm";

export const metadata: Metadata = {
  title: "Style Options | Horizon UI",
};

const StyleOptionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStyleId, setDeleteStyleId] = useState<number | null>(null);
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
    {
      Header: "IMAGE",
      accessor: "imageUrl",
    },
    { Header: "NAME", accessor: "name" },
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

  const fetchStyles = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/style-options?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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
          throw new Error(errorData.message || "Failed to fetch style options");
        }
        const data = await response.json();
        setTableData(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Style options loaded successfully!");
        return data;
      } catch (error: any) {
        toast.error(`Failed to fetch style options: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(async () => {
    await fetchStyles({ page: 1, pageSize: 10 });
  }, [fetchStyles]);

  const handleAddStyle = async (styleData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/style-options", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: styleData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add style option");
      }

      toast.success("Style option added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to add style option: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStyle = async (styleData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/style-options/${selectedStyle.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: styleData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update style option");
      }

      toast.success("Style option updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to update style option: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStyleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/style-options/${deleteStyleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete style option");
      }

      toast.success("Style option deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete style option: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteStyleId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteStyleId(id);
    setDeleteModalOpen(true);
  };

  const handleView = (style: any) => {
    setSelectedStyle(style);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (style: any) => {
    setSelectedStyle(style);
    setModalMode("edit");
    setModalOpen(true);
  };

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
            {/* Style Options */}
        </h1>
        <button
          onClick={() => {
            setSelectedStyle(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Style
        </button>
      </div>
      <CheckTable
        columnsData={columnsData}
        fetchData={fetchStyles}
        showIcons={true}
        showSync={false}
        actions={{
          onRefresh: handleRefresh,
        }}
      />

      {isDeleteModalOpen && (
        <Modal onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
          <div className="p-4 dark:text-white">
            <p>Are you sure you want to delete this style option? This action cannot be undone.</p>
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
              ? "Add New Style"
              : modalMode === "edit"
              ? "Edit Style"
              : "View Style"
          }
        >
          <StyleForm
            onSubmit={modalMode === "edit" ? handleEditStyle : handleAddStyle}
            onCancel={() => setModalOpen(false)}
            defaultValues={selectedStyle}
            mode={modalMode}
          />
        </Modal>
      )}
    </div>
  );
};

export default StyleOptionsPage;
