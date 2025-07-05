import * as React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import type { CellPosition } from "../types/common";
import { useSelection } from "./hooks/useSelection/useSelection";
import { createTableColumns } from "./tableColumns";
import { useEditData } from "./hooks/useEditData/useEditData";
import useKeyboardEvents from "./hooks/useKeyboardEvents/useKeyboardEvents";
import VirtualizedTable from "./components/VirtualizedTable/VirtualizedTable";
import { FormattingToolbar } from "./components/FormattingToolbar/FormattingToolbar";
import { useReportData } from "./hooks/useReportData/useReportData";
import { REPORT_ID } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";

const Grid: React.FC = () => {
  const {
    data,
    setData,
    updateCellFormatting,
    updateMultipleCellsFormatting,
    loading,
  } = useReportData(REPORT_ID);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Grid manages selection and edit state
  const selectionHook = useSelection();
  const editHook = useEditData({ data, onDataUpdate: setData });

  // Calculate grid dimensions
  const totalRows = data.rows.length;
  const totalColumns = data.columnOrder.length;

  // Ref for the scrollable container
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Handle keyboard events at grid level
  useKeyboardEvents({
    selectionHook,
    editHook,
    totalRows,
    totalColumns,
    updateCellFormatting,
    cellMetadata: data.cellMetadata,
    updateMultipleCellsFormatting,
  });

  // Helper function to create cell position
  const createCellPosition = React.useCallback(
    (rowIndex: number, columnIndex: number): CellPosition => ({
      row: rowIndex,
      column: columnIndex,
    }),
    []
  );

  // Create selection context value with dimensions and edit state
  const selectionContextValue = React.useMemo(
    () => ({
      ...selectionHook,
      ...editHook,
      totalRows,
      totalColumns,
    }),
    [selectionHook, editHook, totalRows, totalColumns]
  );

  // Create columns using TanStack Table's grouping
  const columns = React.useMemo(() => {
    return createTableColumns(data, createCellPosition);
  }, [data, createCellPosition]);

  const table = useReactTable({
    data: data.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border bg-card relative">
      <VirtualizedTable
        table={table}
        tableContainerRef={tableContainerRef}
        selectionContextValue={selectionContextValue}
      />
      <FormattingToolbar
        selectionHook={selectionHook}
        updateCellFormatting={updateCellFormatting}
        cellMetadata={data.cellMetadata}
        targetRef={tableContainerRef}
      />

      {/* TODO: move into a separate component */}
      {loading && (
        <div className="absolute inset-0 w-full h-full bg-background/80 backdrop-blur-sm z-50 p-4">
          <div className="w-full h-full space-y-4">
            {/* Full-width skeletons at top */}
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />

            {/* Table-like cell skeletons */}
            <div className="space-y-2 mt-6 overflow-hidden h-full max-h-[calc(100%-8rem)]">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 w-full">
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Grid };
