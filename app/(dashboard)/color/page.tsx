"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Colors | Horizon UI",
};

const ColorListPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
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
    { Header: "NAME", accessor: "name" },
    { Header: "HEX CODE", accessor: "hexCode" },
    { Header: "DATE", accessor: "createdAt" },
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

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {/* Color List */}
        </h1>
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
    </div>
  );
};

export default ColorListPage;
