"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import PanelForm from "@/components/forms/PanelForm"; // Form for managing panel data

// export const metadata: Metadata = {
//   title: "Panels | Horizon UI",
// };

const PanelListPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePanelId, setDeletePanelId] = useState<number | null>(null);
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
    { Header: "NAME", accessor: "name" },
    { Header: "DESCRIPTION", accessor: "description" },
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

  const fetchPanels = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/panels?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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
          throw new Error(errorData.message || "Failed to fetch panels");
        }
        const data = await response.json();
        setTableData(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Panels loaded successfully!");
        return data;
      } catch (error: any) {
        toast.error(`Failed to fetch panels: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const handleRefresh = useCallback(async () => {
    await fetchPanels({ page: 1, pageSize: 10 });
  }, [fetchPanels]);

  const handleAddPanel = async (panelData: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/panels", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(panelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add panel");
      }

      toast.success("Panel added successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to add panel: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPanel = async (panelData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/panels?id=${String(selectedPanel.id)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(panelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update panel");
      }

      toast.success("Panel updated successfully!");
      setModalOpen(false);
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to update panel: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePanelId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/panels?id=${String(deletePanelId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete panel");
      }

      toast.success("Panel deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete panel: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeletePanelId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeletePanelId(id);
    setDeleteModalOpen(true);
  };

  const handleView = (panel: any) => {
    setSelectedPanel(panel);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (panel: any) => {
    setSelectedPanel(panel);
    setModalMode("edit");
    setModalOpen(true);
  };

  useEffect(() => {
    fetchPanels();
  }, [fetchPanels]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
            {/* Panel List */}
        </h1>
        <button
          onClick={() => {
            setSelectedPanel(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Panel
        </button>
      </div>
      <CheckTable
        columnsData={columnsData}
        fetchData={fetchPanels}
        showIcons={true}
        showSync={false}
        actions={{
          onRefresh: handleRefresh,
        }}
      />

      {isDeleteModalOpen && (
        <Modal onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
          <div className="p-4 dark:text-white">
            <p>Are you sure you want to delete this panel? This action cannot be undone.</p>
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
              ? "Add New Panel"
              : modalMode === "edit"
              ? "Edit Panel"
              : "View Panel"
          }
        >
          <PanelForm
            onSubmit={modalMode === "edit" ? handleEditPanel : handleAddPanel}
            onCancel={() => setModalOpen(false)}
            defaultValues={selectedPanel}
            mode={modalMode}
          />
        </Modal>
      )}
    </div>
  );
};

export default PanelListPage;
