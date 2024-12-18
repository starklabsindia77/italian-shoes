import { type Metadata } from "next";
import CheckTable from "../data-tables/components/CheckTable";
import DevelopmentTable from "../data-tables/components/DevelopmentTable";
import ColumnsTable from "../data-tables/components/ColumnsTable";
import ComplexTable from "../data-tables/components/ComplexTable";

import {
  columnsDataDevelopment,
  columnsDataCheck,
  columnsDataColumns,
  columnsDataComplex,
} from "../data-tables/variables/columnsData";
import tableDataDevelopment from "../data-tables/variables/tableDataDevelopment.json";
import tableDataCheck from "../data-tables/variables/tableDataCheck.json";
import tableDataColumns from "../data-tables/variables/tableDataColumns.json";
import tableDataComplex from "../data-tables/variables/tableDataComplex.json";

export const metadata: Metadata = {
    title: 'DataTables | Horizon UI by Ories',
  }
  
  const DataTablesPage = () => {
    return (
      <div>
        <div className="mt-5 grid h-full grid-cols-1 gap-5 ">
          {/* <DevelopmentTable
            columnsData={columnsDataDevelopment}
            tableData={tableDataDevelopment}
          /> */}
          <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} />
        </div>
  
        {/* <div className="mt-5 grid h-full grid-cols-1 gap-5 md:grid-cols-2">
          <ColumnsTable
            columnsData={columnsDataColumns}
            tableData={tableDataColumns}
          />
  
          <ComplexTable
            columnsData={columnsDataComplex}
            tableData={tableDataComplex}
          />
        </div> */}
      </div>
    );
  };
  
  export default DataTablesPage;