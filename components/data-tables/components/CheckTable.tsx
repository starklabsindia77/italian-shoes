'use client'

import { useMemo } from "react";
import CardMenu from "@/components/card/CardMenu";
import Card from "@/components/card";
import Checkbox from "@/components/checkbox";
import { FiRefreshCw } from "react-icons/fi";
import { AiOutlineCloudDownload } from "react-icons/ai";

import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

type Props = {
  columnsData: any[];
  tableData: any[];
  showIcons: boolean;
  onRefresh: () => void;
  onSync: () => void;
};

const CheckTable = (props: Props) => {
  const { columnsData, tableData, showIcons, onRefresh, onSync } = props;

  const columns = useMemo(() => columnsData, [columnsData]);
  const data = useMemo(() => tableData, [tableData]);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    initialState,
  } = tableInstance;
  initialState.pageSize = 11;

  return (
    <Card className={"w-full sm:overflow-auto p-4"}>
      <header className="relative flex items-center justify-between">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          {/* Check Table */}
        </div>
        <div className="flex items-center gap-4">
          {showIcons && (
            <>
              <button
                onClick={onRefresh}
                className="text-gray-500 hover:text-navy-700 dark:hover:text-white"
              >
                <FiRefreshCw size={20} />
              </button>
              <button
                onClick={onSync}
                className="text-gray-500 hover:text-navy-700 dark:hover:text-white"
              >
                <AiOutlineCloudDownload size={20} />
              </button>
            </>
          )}
          <CardMenu />
        </div>
      </header>

      <div className="mt-8 overflow-x-auto">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400  mb-20 mt-10">
            No records found.
          </div>
        ) : (
          <table
            {...getTableProps()}
            className="w-full"
            color="gray-500"
          >
            <thead>
              {headerGroups.map((headerGroup, index) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                  {headerGroup.headers.map((column, index) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="border-b border-gray-200 pr-16 pb-[10px] text-start dark:!border-navy-700"
                      key={index}
                    >
                      <div className="text-xs font-bold tracking-wide text-gray-600 lg:text-xs">
                        {column.render("Header")}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row, index) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} key={index}>
                    {row.cells.map((cell, index) => {
                      let renderData;
                      if (cell.column.Header === "NAME") {
                        renderData = (
                          <div className="flex items-center gap-2">
                            <Checkbox />
                            <p className="text-sm font-bold text-navy-700 dark:text-white">
                              {cell.value}
                            </p>
                          </div>
                        );
                      } else if (cell.column.Header === "PROGRESS") {
                        renderData = (
                          <div className="flex items-center">
                            <p className="text-sm font-bold text-navy-700 dark:text-white">
                              {cell.value}%
                            </p>
                          </div>
                        );
                      } else if (cell.column.Header === "QUANTITY") {
                        renderData = (
                          <p className="text-sm font-bold text-navy-700 dark:text-white">
                            {cell.value}
                          </p>
                        );
                      } else if (cell.column.Header === "DATE") {
                        renderData = (
                          <p className="text-sm font-bold text-navy-700 dark:text-white">
                            {cell.value}
                          </p>
                        );
                      }
                      return (
                        <td
                          {...cell.getCellProps()}
                          key={index}
                          className="pt-[14px] pb-[16px] sm:text-[14px]"
                        >
                          {renderData}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export default CheckTable;
