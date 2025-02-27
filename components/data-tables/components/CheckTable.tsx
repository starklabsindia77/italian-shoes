/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { FiRefreshCw } from "react-icons/fi";
import { AiOutlineCloudDownload } from "react-icons/ai";
import moment from "moment";

const Card = dynamic(() => import('@/components/card'), { ssr: false });
const Checkbox = dynamic(() => import('@/components/checkbox'), { ssr: false });

interface RowData {
  id: number;
  shopifyProduct?: { title: string };
  variant?: { name: string };
  price?: number;
  inventoryQuantity?: number;
  createdAt?: string;
  [key: string]: any;
}

type FetchParams = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type CheckTableProps = {
  fetchData: (params: FetchParams) => Promise<{ data: RowData[]; total: number }>;
  columnsData: { Header: string; accessor: string; Cell?: (props: { row: RowData }) => JSX.Element }[];
  showIcons?: boolean;
  showRefresh?: boolean;
  showSync?: boolean;
  actions?: { onRefresh?: () => void; onSync?: () => void };
  rowsPerPageOptions?: number[];
};

const CheckTable = ({
  columnsData,
  fetchData,
  showIcons = true,
  showRefresh = true,
  showSync = true,
  actions = {},
  rowsPerPageOptions = [5, 10, 20, 50],
}: CheckTableProps) => {
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("asc");
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const columns = useMemo(() => columnsData, [columnsData]);
  const pageCount = Math.ceil(totalRecords / rowsPerPage);

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const { data, total } = await fetchData({
        page: currentPage,
        pageSize: rowsPerPage,
        sortBy,
        sortOrder,
      });
      setTableData(data || []);
      setTotalRecords(total || 0);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (columnAccessor: string) => {
    const newSortOrder = sortBy === columnAccessor && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(columnAccessor);
    setSortOrder(newSortOrder);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = Number(e.target.value);
    setRowsPerPage(newPageSize);
    setCurrentPage(1);
  };

  const handlePageChange = (direction: "next" | "previous") => {
    if (direction === "next" && currentPage < pageCount) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "previous" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const toggleRowSelection = (index: number) => {
    const updatedSelection = new Set(selectedRows);
    if (updatedSelection.has(index)) updatedSelection.delete(index);
    else updatedSelection.add(index);
    setSelectedRows(updatedSelection);
  };

  useEffect(() => {
    fetchTableData();
  }, [currentPage, rowsPerPage, sortBy, sortOrder]);

  return (
    <Card className="w-full sm:overflow-auto p-4 mt-2">
      <header className="relative flex items-center justify-between">
        <div className="text-xl font-bold text-navy-700 dark:text-white">Check Table</div>
        <div className="flex items-center gap-4">
          {showIcons && (
            <>
              {actions.onRefresh && showRefresh && (
                <button onClick={actions.onRefresh} className="text-gray-500 hover:text-navy-700 dark:hover:text-white">
                  <FiRefreshCw size={20} />
                </button>
              )}
              {actions.onSync && showSync && (
                <button onClick={actions.onSync} className="text-gray-500 hover:text-navy-700 dark:hover:text-white">
                  <AiOutlineCloudDownload size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </header>
      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : tableData.length === 0 ? (
          <div className="text-center py-10">No records found.</div>
        ) : (
          <table className="w-full border-collapse" role="grid">
            <thead>
              <tr role="row">
                <th className="border border-gray-300 px-4 py-2 text-center" aria-label="Select all">
                  <Checkbox
                    onChange={() => setSelectedRows(new Set(tableData.map((_, index) => index)))}
                    checked={selectedRows.size === tableData.length}
                    aria-label="Select all rows"
                  />
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(column.accessor)}
                    className={`cursor-pointer border border-gray-300 px-4 py-2 text-center ${
                      sortBy === column.accessor ? (sortOrder === "asc" ? "text-blue-500" : "text-red-500") : ""
                    }`}
                  >
                    {column.Header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} role="row">
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <Checkbox
                      onChange={() => toggleRowSelection(rowIndex)}
                      checked={selectedRows.has(rowIndex)}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </td>
                  {columnsData.map((column, colIndex) => {
                    const getValue = (accessor: string | number, row: Record<string, any>): any => {
                      if (accessor === "id") return rowIndex + 1;
                      if (typeof accessor === "string" && accessor.includes(".")) {
                        const [part1, part2] = accessor.split(".");
                        return row[part1]?.[part2];
                      }
                      return row[accessor];
                    };

                    return (
                      <td key={colIndex} className="border border-gray-300 px-4 py-2 text-center items-center">
                        {column.Cell ? (
                          column.Cell({ row })
                        ) : column.accessor === "createdAt" ? (
                          moment(getValue(column.accessor, row)).format("MMM DD, YYYY")
                        ) : column.accessor === "imageUrl" ? (
                          <Image
                            src={getValue(column.accessor, row)}
                            alt="Row"
                            width={80}
                            height={80}
                            className="object-cover mx-auto"
                          />
                        ) : (
                          getValue(column.accessor, row)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm">
          Rows per page:
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="ml-2 border rounded px-2 py-1 text-gray-700 dark:text-black"
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handlePageChange("previous")}
            disabled={currentPage <= 1}
            className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>Page {currentPage} of {pageCount}</span>
          <button
            onClick={() => handlePageChange("next")}
            disabled={currentPage >= pageCount}
            className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
};

export default CheckTable;