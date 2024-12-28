// "use client";

// import { useState, useEffect } from 'react';
// import axios from 'axios';

// type Variant = {
//   id: number;
//   title: string;
//   sku: string | null;
//   price: number;
//   inventoryQuantity: number;
//   inventoryPolicy: string;
//   inventoryItemId: string | null;
//   variantId: string;
//   createdAt : string;
// };

// export default function VariantsPage() {
//   const [variants, setVariants] = useState<Variant[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(false);

//   const pageSize = 10;

//   useEffect(() => {
//     fetchVariants();
//   }, [currentPage]);

//   const fetchVariants = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get('/api/variants', {
//         params: { page: currentPage, pageSize },
//       });
//       setVariants(response.data.data);
//       setTotalPages(response.data.meta.totalPages);
//     } catch (error) {
//       console.error('Error fetching variants:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   const handleNext = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <h1 className="text-2xl font-bold mb-4">Variants List</h1>
//       {loading ? (
//         <p className="text-center">Loading...</p>
//       ) : (
//         <div className="bg-white rounded-lg shadow-md overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Title
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   SKU
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Price
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Inventory
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Created At
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {variants.map((variant) => (
//                 <tr key={variant.id}>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     {variant.title}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {variant.sku || 'N/A'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     ${variant.price.toFixed(2)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {variant.inventoryQuantity}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {variant.createdAt}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Pagination Controls */}
//       <div className="mt-4 flex justify-between items-center">
//         <button
//           onClick={handlePrevious}
//           disabled={currentPage === 1}
//           className={`px-4 py-2 rounded-md ${
//             currentPage === 1
//               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//               : 'bg-blue-500 text-white hover:bg-blue-600'
//           }`}
//         >
//           Previous
//         </button>
//         <p>
//           Page {currentPage} of {totalPages}
//         </p>
//         <button
//           onClick={handleNext}
//           disabled={currentPage === totalPages}
//           className={`px-4 py-2 rounded-md ${
//             currentPage === totalPages
//               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//               : 'bg-blue-500 text-white hover:bg-blue-600'
//           }`}
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import { type Metadata } from "next";
import { useCallback, useState, useEffect } from "react";
import CheckTable from "@/components/data-tables/components/CheckTable";
import { toast } from "react-hot-toast";
import axios from "axios";

export const metadata: Metadata = {
  title: "Variants | Horizon UI",
};

const VariantsPage = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
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
      Header: "POLICY",
      accessor: "inventoryPolicy",
    },
  ];

  // Fetch Variants
  const fetchVariants = useCallback(async () => {
    setLoading(true);
    toast.loading("Fetching variants...");
    try {
      const response = await axios.get("/api/variants", {
        params: { page: 1, pageSize: 10 }, // Example pagination parameters
      });
      toast.dismiss();
      toast.success("Variants loaded successfully!");
      setTableData(response.data.data || []);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to fetch variants: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh Variants
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    toast.loading("Refreshing variants...");
    try {
      // Assuming refresh logic is implemented on the backend
      const response = await axios.get("/api/variants", {
        params: { page: 1, pageSize: 10 },
      });
      toast.dismiss();
      toast.success("Variants refreshed successfully!");
      setTableData(response.data.data || []);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to refresh variants: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync Variants
  const handleSync = useCallback(async () => {
    setLoading(true);
    toast.loading("Syncing variants...");
    try {
      await axios.post("/api/variants/sync"); // Adjust the endpoint if needed
      toast.dismiss();
      toast.success("Variants synchronized successfully!");
      fetchVariants(); // Refresh the table after syncing
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to sync variants: ${error.message}`);
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
          columnsData={[
            { Header: "Title", accessor: "title" },
            { Header: "SKU", accessor: "sku" },
            { Header: "Price", accessor: "price" },
            { Header: "Inventory", accessor: "inventoryQuantity" },
            { Header: "Date", accessor: "CreatedAt" },
          ]}
          fetchData={async ({ page, pageSize, sortBy, sortOrder }) => {
            const response = await fetch(
              `/api/variants?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
            );
            const result = await response.json();
            return result; // { data: [], total: number }
          }}
          showIcons={true}
          actions={{
            onRefresh: () => console.log("Refresh triggered"),
            onSync: () => console.log("Sync triggered"),
          }}
        />
      </div>
    </div>
  );
};

export default VariantsPage;
