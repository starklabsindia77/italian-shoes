"use client";

import { useState, useCallback, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import Modal from "@/components/Modal";
import SizeForm from "@/components/forms/SizeForm";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

const SizeListPage = () => {
  const [sizeOptions, setSizeOptions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedSizeOption, setSelectedSizeOption] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSizeId, setDeleteSizeId] = useState<number | null>(null);
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

  const fetchSizeOptions = useCallback(
    async ({
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/size-options?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch size options");
        const data = await response.json();
        setSizeOptions(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Size Options loaded successfully!");
        setLoading(false);
        return data;
      } catch (error) {
        toast.error("Error fetching size options");
      }
    },
    []
  );

  useEffect(() => {
    fetchSizeOptions();
  }, [fetchSizeOptions]);

  const handleAddSizeOption = async (sizeOptionData: any) => {
    try {
      const response = await fetch("/api/size-options", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sizeOptionData),
      });
      if (!response.ok) throw new Error("Failed to add size option");
      toast.success("Size option added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error) {
      toast.error("Error adding size option");
    }
  };

  const handleEditSizeOption = async (sizeOptionData: any) => {
    try {
      const response = await fetch(
        `/api/size-options?id=${String(selectedSizeOption.id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sizeOptionData),
        }
      );
      if (!response.ok) throw new Error("Failed to update size option");
      toast.success("Size option updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error) {
      toast.error("Error updating size option");
    }
  };


  const handleDelete = async () => {
    if (!deleteSizeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/size-options?id=${String(deleteSizeId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete size option");
      }

      toast.success("Size option deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete size option: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteSizeId(null);
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchSizeOptions({ page: 1, pageSize: 10 });
  }, [fetchSizeOptions]);

  const handleEdit = (sizeOption: any) => {
    setSelectedSizeOption(sizeOption);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (sizeOption: any) => {
    setSelectedSizeOption(sizeOption);
    setModalMode("view");
    setModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setDeleteSizeId(id);
    setDeleteModalOpen(true);
  };

  const columnsData = [
    { Header: "SIZE SYSTEM", accessor: "sizeSystem" },
    { Header: "SIZE", accessor: "size" },
    { Header: "WIDTH", accessor: "width" },
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

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{/* Panel List */}</h1>
        {/* <button onClick={() => setModalMode("add")}>Add Size Option</button> */}
        <button
          onClick={() => {
            setSelectedSizeOption(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Size Option
        </button>
      </div>
      <CheckTable
        columnsData={columnsData}
        fetchData={fetchSizeOptions}
        showIcons={true}
        showSync={false}
        actions={{
          onRefresh: handleRefresh,
        }}
      />
      {isModalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          title={
            modalMode === "add"
              ? "Add Size Option"
              : modalMode === "edit"
              ? "Edit Size Option"
              : "View Size Option"
          }
        >
          <SizeForm
            mode={modalMode}
            defaultValues={selectedSizeOption}
            onSubmit={
              modalMode === "edit" ? handleEditSizeOption : handleAddSizeOption
            }
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
          <div className="p-4 dark:text-white">
            <p>
              Are you sure you want to delete this Size Option? This action
              cannot be undone.
            </p>
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
    </div>
  );
};

export default SizeListPage;
