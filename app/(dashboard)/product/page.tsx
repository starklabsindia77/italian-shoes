'use client'

import { type Metadata } from "next";
import { useCallback, useState, useEffect  } from 'react';
import CheckTable from "@/components/data-tables/components/CheckTable";
import { columnsDataCheck } from "@/components/data-tables/variables/columnsData";
import tableDataCheck from "@/components/data-tables/variables/tableDataCheck.json";
import { triggerProductSync, triggerProductRefresh } from "@/services/productService";

import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';


export const metadata: Metadata = {
  title: "DataTables | Horizon UI by Ories",
};

const ShopifyProductList = () => {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const userData = Cookies.get('auth_token'); // Assuming user data is stored in cookies as JSON
    if (userData) {
        try {
          setToken(JSON.parse(userData).value);
        } catch (error) {
            console.error('Failed to parse user data:', error);
        }
    }
}, []);

    // Refresh logic (for future implementation)
    const handleRefresh = useCallback(async () => {
      setLoading(true); // Start loading
      toast.loading('Refreshing products...');
      try {
          const response = await triggerProductRefresh(token);   // Trigger the sync
          toast.dismiss(); // Clear any previous loaders
          toast.success('Products refreshed successfully!');
          setTableData(response);
      } catch (error: any) {
          toast.dismiss();
          toast.error(`Failed to refresh products: ${error.message}`);
      } finally {
          setLoading(false); // Stop loading
      }
    }, []);

    // Sync Shopify Products
    const handleSync = useCallback(async () => {
        setLoading(true); // Start loading
        toast.loading('Syncing products...');
        try {
            await triggerProductSync(token); // Trigger the sync
            toast.dismiss(); // Clear any previous loaders
            toast.success('Products synchronized successfully!');
        } catch (error: any) {
            toast.dismiss();
            toast.error(`Failed to sync products: ${error.message}`);
        } finally {
            setLoading(false); // Stop loading
        }
    }, []);
  return (
    <div>
      <div className="mt-5 grid h-full grid-cols-1 gap-5 ">        
        <CheckTable columnsData={columnsDataCheck} tableData={tableData} showIcons={true} onRefresh={handleRefresh} onSync={handleSync} />
      </div>      
    </div>
  );
};

export default ShopifyProductList;
