'use client';

import { type Metadata } from "next";
import { useCallback, useState } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { triggerProductSync, triggerProductRefresh } from "@/services/productService";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

export const metadata: Metadata = {
  title: "DataTables | Horizon UI by Ories",
};

// Define the fetch parameters type
type FetchParams = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const ShopifyProductList = () => {
  // Get the token from cookies
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

  // Fetch data with server-side pagination and sorting
  const fetchData = useCallback(
    async ({ page, pageSize, sortBy = "createdAt", sortOrder = "desc" }: FetchParams) => {
      toast.loading("Fetching products...");
      try {
        const response = await triggerProductRefresh(token, page, pageSize, sortBy, sortOrder);
        toast.dismiss();
        toast.success("Products fetched successfully!");
        console.log("Response data:", response);
        return response;
      } catch (error: any) {
        toast.dismiss();
        toast.error(`Failed to fetch products: ${error.message}`);
        return { data: [], total: 0 };
      }
    },
    [token]
  );

  // Sync products logic
  const handleSync = useCallback(async () => {
    toast.loading("Syncing products...");
    try {
      await triggerProductSync(token);
      toast.dismiss();
      toast.success("Products synchronized successfully!");
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to sync products: ${error.message}`);
    }
  }, [token]);

  // Define the table columns
  const columnsData = [
    { Header: "Image", accessor: "imageUrl" },
    { Header: "Name", accessor: "title" },
    { Header: "Vendor", accessor: "vendor" },
    { Header: "Handle", accessor: "handle" },
    { Header: "Date", accessor: "createdAt" },
  ];

  // Render the component
  return (
    <div>
      <div className="mt-5 grid h-full grid-cols-1 gap-5">
        <CheckTable
          columnsData={columnsData}
          fetchData={fetchData} // Pass corrected fetchData function
          showIcons={true}
          actions={{
            onRefresh: () => fetchData({ page: 1, pageSize: 10 }), // Trigger fetchData on refresh
            onSync: handleSync,
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </div>
    </div>
  );
};

export default ShopifyProductList;


