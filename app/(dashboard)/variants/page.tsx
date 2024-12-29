"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import VariantForm from "@/components/VariantForm"; // Create this component for the form

export const metadata: Metadata = {
  title: "Variants | Horizon UI",
};

const VariantsPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false); // Track modal state
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
    { Header: "TITLE", accessor: "title" },
    { Header: "SKU", accessor: "sku" },
    { Header: "PRICE", accessor: "price" },
    { Header: "INVENTORY", accessor: "inventoryQuantity" },
    { Header: "MATERIAL", accessor: "material.name" },
    { Header: "COLOR", accessor: "color.name" },
    { Header: "SIZE", accessor: "size.size" },
    { Header: "STYLE", accessor: "style.name" },
    { Header: "SOLE", accessor: "sole.type" },
    { Header: "PANEL", accessor: "panel.name" },
    { Header: "DATE", accessor: "createdAt" },
  ];

  const fetchVariants = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/variants?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch variants");
        }
        const data = await response.json();

        console.log("varaint res", data);
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
          "Content-Type": "application/json",
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

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
            {/* Variants */}
        </h1>
        <button
          onClick={() => setModalOpen(true)}
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
          onSync: () => console.log("Sync triggered"),
        }}
      />

      {isModalOpen && (
        <Modal onClose={() => setModalOpen(false)} title="Add New Variant">
          <VariantForm onSubmit={handleAddVariant} onCancel={() => setModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default VariantsPage;
