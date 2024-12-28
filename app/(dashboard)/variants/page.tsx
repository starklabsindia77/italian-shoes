"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import axios from "axios";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "Variants | Horizon UI",
};

const VariantsPage = () => {
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
    {
      Header: "TITLE",
      accessor: "title",
    },
    {
      Header: "SKU",
      accessor: "sku",
    },
    {
      Header: "PRICE",
      accessor: "price",
    },
    {
      Header: "INVENTORY",
      accessor: "inventoryQuantity",
    },
    {
      Header: "Date",
      accessor: "createdAt",
    },
  ];

  // Fetch Variants with Pagination and Sorting
  const fetchVariants = useCallback(
    async ({ page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "asc" } = {}) => {
      setLoading(true);
      toast.loading("Fetching variants...");
      try {
        // const response = await axios.get("/api/variants/index", {
        //   params: { page, pageSize, sortBy, sortOrder },
        //   headers:{
        //     Authorization: `Bearer ${token}`,
        //     "Content-Type": "application/json",
        //   }
        // });
        const response = await fetch(`/api/variants?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          // Parse the JSON response
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to refresh products");
          }
      
        const data = await response.json();
        toast.dismiss();
        toast.success("Variants loaded successfully!");
        return data;
        
        // setTableData(data.data || []);
        // setTotalRecords(data.total || 0);
        // return { data: data.data || [], total: data.total || 0 };
      } catch (error: any) {
        toast.dismiss();
        toast.error(`Failed to fetch variants: ${error.message}`);
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Refresh Variants
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    toast.loading("Refreshing variants...");
    try {
      const response = await fetchVariants({ page: 1, pageSize: 10 }); // Reset to page 1 with default params
      setTableData(response.data);
      setTotalRecords(response.total);
      toast.dismiss();
      toast.success("Variants refreshed successfully!");
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to refresh variants.");
    } finally {
      setLoading(false);
    }
  }, [fetchVariants]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  return (
    <div className="min-h-screen p-6">
      <div className="mt-5 grid h-full grid-cols-1 gap-5">
        <CheckTable
          columnsData={columnsData}
          fetchData={fetchVariants} // Use the fetchVariants function directly
          showIcons={true}
          showSync={false}
              actions={{
            onRefresh: handleRefresh, // Use the refresh logic
            onSync: () => console.log("Sync triggered"), // Placeholder for sync
          }}
        />
      </div>
    </div>
  );
};

export default VariantsPage;
