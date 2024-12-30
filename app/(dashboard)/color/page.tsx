"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import ColorForm from "@/components/forms/ColorForm"; // Create this component for the form

export const metadata: Metadata = {
  title: "Colors | Horizon UI",
};

const ColorListPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false); // Track modal state
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedColor, setSelectedColor] = useState<any>(null); // Track selected color for edit/view
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
    { Header: "HEX CODE", accessor: "hexCode" },
    { Header: "DATE", accessor: "createdAt" },
    {
      Header: "ACTIONS",
      Cell: ({ row }: { row: any }) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handleView(row)}
            className="px-2 py-1 bg-green-500 text-white text-sm rounded"
          >
            View
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="px-2 py-1 bg-yellow-500 text-white text-sm rounded"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-2 py-1 bg-red-500 text-white text-sm rounded"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const fetchColors = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/colors?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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
          throw new Error(errorData.message || "Failed to fetch colors");
        }
        const data = await response.json();
        setTableData(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Colors loaded successfully!");
        return data;
      } catch (error: any) {
        toast.error(`Failed to fetch colors: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(async () => {
    await fetchColors({ page: 1, pageSize: 10 }); // Reset to the first page with default params
  }, [fetchColors]);

  const handleAddColor = async (colorData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/colors", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: colorData, // FormData is directly passed as body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add color");
      }

      toast.success("Color added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to add color: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditColor = async (colorData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/colors/${selectedColor.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: colorData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update color");
      }

      toast.success("Color updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to update color: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this color?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/colors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete color");
      }

      toast.success("Color deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete color: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (color: any) => {
    setSelectedColor(color);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (color: any) => {
    setSelectedColor(color);
    setModalMode("edit");
    setModalOpen(true);
  };

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {/* Color List */}
        </h1>
        <button
          onClick={() => {
            setSelectedColor(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Color
        </button>
      </div>
      <CheckTable
        columnsData={columnsData}
        fetchData={fetchColors}
        showIcons={true}
        showSync={false}
        actions={{
          onRefresh: handleRefresh, // Handle refresh action
        }}
      />

      {isModalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          title={
            modalMode === "add"
              ? "Add New Color"
              : modalMode === "edit"
              ? "Edit Color"
              : "View Color"
          }
        >
          <ColorForm
            onSubmit={modalMode === "edit" ? handleEditColor : handleAddColor}
            onCancel={() => setModalOpen(false)}
            defaultValues={selectedColor}
            mode={modalMode}
          />
        </Modal>
      )}
    </div>
  );
};

export default ColorListPage;
