'use client'

import { type Metadata } from "next";
import { useCallback } from 'react';
import CheckTable from "@/components/data-tables/components/CheckTable";

import { columnsDataCheck } from "@/components/data-tables/variables/columnsData";

import tableDataCheck from "@/components/data-tables/variables/tableDataCheck.json";

export const metadata: Metadata = {
  title: "DataTables | Horizon UI by Ories",
};

const ShopifyProductList = () => {
  const handleRefresh = useCallback(() => {
    console.log('Refresh triggered');
  }, []);

  const handleSync = useCallback(() => {
    console.log('Sync triggered');
  }, []);
  return (
    <div>
      <div className="mt-5 grid h-full grid-cols-1 gap-5 ">        
        <CheckTable columnsData={columnsDataCheck} tableData={[]} showIcons={true} onRefresh={handleRefresh} onSync={handleSync} />
      </div>      
    </div>
  );
};

export default ShopifyProductList;
