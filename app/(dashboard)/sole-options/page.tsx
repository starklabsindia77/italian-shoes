/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import Modal from "@/components/Modal";
import SoleForm from "@/components/forms/SoleForm";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

const SoleOptionsListPage = () => {
  const [soleOptions, setSoleOptions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedSoleOption, setSelectedSoleOption] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSoleId, setDeleteSoleId] = useState<number | null>(null);
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
    { Header: "TYPE", accessor: "type" },
    { Header: "HEIGHT", accessor: "height" },
    { Header: "DATE", accessor: "createdAt" },
    {
      Header: "ACTIONS",
      accessor: "actions",
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

  const fetchSoleOptions = useCallback(
    async ({
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sole-options?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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
          throw new Error(errorData.message || "Failed to fetch sole options");
        }
        const data = await response.json();
        setSoleOptions(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Sole options loaded successfully!");
        return data;
      } catch (error: any) {
        toast.error(`Failed to fetch sole options: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(async () => {
    await fetchSoleOptions({ page: 1, pageSize: 10 });
  }, [fetchSoleOptions]);

  const handleAddSoleOption = async (soleOptionData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/sole-options", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: soleOptionData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add sole option");
      }
      toast.success("Sole option added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to add sole option: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSoleOption = async (soleOptionData: FormData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sole-options?id=${String(selectedSoleOption.id)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: soleOptionData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update sole option");
      }
      toast.success("Sole option updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to update sole option: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSoleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sole-options?id=${String(deleteSoleId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete sole option");
      }
      toast.success("Sole option deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete sole option: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteSoleId(null);
    }
  };

  const handleView = (soleOption: any) => {
    setSelectedSoleOption(soleOption);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (soleOption: any) => {
    setSelectedSoleOption(soleOption);
    setModalMode("edit");
    setModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setDeleteSoleId(id);
    setDeleteModalOpen(true);
  };

  useEffect(() => {
    fetchSoleOptions();
  }, [fetchSoleOptions]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Sole Options</h1>
        <button
          onClick={() => {
            setSelectedSoleOption(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Sole Option
        </button>
      </div>
      <CheckTable
        columnsData={columnsData}
        fetchData={fetchSoleOptions}
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
              ? "Add New Sole Option"
              : modalMode === "edit"
              ? "Edit Sole Option"
              : "View Sole Option"
          }
        >
          <SoleForm
            mode={modalMode}
            defaultValues={selectedSoleOption}
            onSubmit={modalMode === "edit" ? handleEditSoleOption : handleAddSoleOption}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
          <div className="p-4 dark:text-white">
            <p>Are you sure you want to delete this sole option? This action cannot be undone.</p>
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

export default SoleOptionsListPage;