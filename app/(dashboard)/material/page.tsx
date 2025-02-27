"use client";

import { useState, useCallback, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import Modal from "@/components/Modal";
import MaterialForm from "@/components/forms/MaterialForm";
import { FiEye, FiEdit, FiTrash } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

const MaterialListPage = () => {
  const [materials, setMaterials] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMaterialId, setDeleteMaterialId] = useState<number | null>(null);
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

  const fetchMaterials = useCallback(
    async ({
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/materials?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch materials");
        const data = await response.json();
        setMaterials(data.data || []);
        setTotalRecords(data.meta.totalItems || 0);
        toast.success("Materials loaded successfully!");
        return data;
      } catch (error) {
        toast.error("Error fetching materials");
      }
    },
    []
  );
  const handleRefresh = useCallback(async () => {
    await fetchMaterials({ page: 1, pageSize: 10 });
  }, [fetchMaterials]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleAddMaterial = async (materialData: any) => {
    console.log("materialData ====>", materialData);
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(materialData),
      });
      if (!response.ok) throw new Error("Failed to add material");
      toast.success("Material added successfully!");
      setModalOpen(false);
      fetchMaterials();
    } catch (error) {
      toast.error("Error adding material");
    }
  };

  const handleEditMaterial = async (materialData: any) => {
    try {
      const response = await fetch(`/api/materials?id=${String(selectedMaterial.id)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(materialData),
      });
      if (!response.ok) throw new Error("Failed to update material");
      toast.success("Material updated successfully!");
      setModalOpen(false);
      fetchMaterials();
    } catch (error) {
      toast.error("Error updating material");
    }
  };

  const handleDelete = async () => {
    if (!deleteMaterialId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/materials?id=${String(deleteMaterialId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete material");
      }

      toast.success("Material deleted successfully!");
      await handleRefresh();
    } catch (error: any) {
      toast.error(`Failed to delete material: ${error.message}`);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteMaterialId(null);
    }
  };

  const handleEdit = (material: any) => {
    setSelectedMaterial(material);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (material: any) => {
    setSelectedMaterial(material);
    setModalMode("view");
    setModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setDeleteMaterialId(id);
    setDeleteModalOpen(true);
  };

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
            onClick={() => handleView(row.original)}
            className="px-2 py-1 text-white text-sm rounded"
          >
            <FiEye size={16} />
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="px-2 py-1 text-white text-sm rounded"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => confirmDelete(row.original.id)}
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
        <h1 className="text-xl font-bold">{/* material List */}</h1>
        <button
          onClick={() => {
            setSelectedMaterial(null);
            setModalMode("add");
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New material
        </button>
      </div>
      <CheckTable
        columnsData={columnsData}
        fetchData={fetchMaterials}
        showIcons={true}
        showSync={false}
        actions={{
          onRefresh: handleRefresh,
        }}
      />

      {isDeleteModalOpen && (
        <Modal onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
          <div className="p-4 dark:text-white">
            <p>
              Are you sure you want to delete this material? This action cannot
              be undone.
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

      {isModalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          title={
            modalMode === "add"
              ? "Add New Material"
              : modalMode === "edit"
              ? "Edit Material"
              : "View Material"
          }
        >
          <MaterialForm
            mode={modalMode}
            defaultValues={selectedMaterial}
            onSubmit={
              modalMode === "edit" ? handleEditMaterial : handleAddMaterial
            }
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default MaterialListPage;
