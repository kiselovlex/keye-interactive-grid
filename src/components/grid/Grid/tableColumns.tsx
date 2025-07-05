import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpreadsheetCell } from "./components/SpreadsheetCell/SpreadsheetCell";
import { getMetadataForCell } from "../utils/formatting";
import type { FlattenedRow, AdapterOutput } from "./hooks/useReportData/utils";
import type { CellPosition } from "../types/common";
import { generateCellKey } from "@/components/grid/utils/formatting";
import { REPORT_ID } from "@/api";

const columnHelper = createColumnHelper<FlattenedRow>();

export const createTableColumns = (
  adapterOutput: AdapterOutput,
  createCellPosition: (row: number, col: number) => CellPosition
): ColumnDef<FlattenedRow>[] => {
  const columns: ColumnDef<FlattenedRow>[] = [];

  // First, add the product column as a grouped column with empty header
  const productColumn = columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: ({ getValue, row, column }) => {
      const value = getValue();
      const columnIndex = adapterOutput.columnOrder.indexOf("product");
      const position = createCellPosition(row.index, columnIndex);
      const isTotal = String(value).toLowerCase() === "total";

      // Get metadata from adapter output using correct key format
      const cellKey = generateCellKey(REPORT_ID, row.index, columnIndex);
      const metadata =
        adapterOutput.cellMetadata.get(cellKey) ||
        getMetadataForCell("product", "product", isTotal);

      return (
        <SpreadsheetCell
          rawValue={value}
          metadata={metadata}
          position={position}
          columnKey="product"
          size={column.getSize()}
        />
      );
    },
    enableSorting: true,
    size: 200,
  });

  // Create product group with placeholder header
  const productGroup = columnHelper.group({
    id: "product-group",
    header: () => "", // Placeholder header - renders nothing
    columns: [productColumn],
  });

  columns.push(productGroup);

  // Then, add the grouped columns for each data section
  for (const section of adapterOutput.sections) {
    if (section.type !== "product") {
      // Handle data sections - render with group headers
      const groupColumns: ColumnDef<FlattenedRow>[] = [];

      for (const col of section.columns) {
        const column = columnHelper.accessor(col.id, {
          id: col.id,
          header: ({ column }) => {
            if (column.getCanSort()) {
              const sortDirection = column.getIsSorted();
              const isSorted = sortDirection !== false;

              return (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const currentSort = column.getIsSorted();
                    if (currentSort === false) {
                      // No sort → Ascending
                      column.toggleSorting(false);
                    } else if (currentSort === "asc") {
                      // Ascending → Descending
                      column.toggleSorting(true);
                    } else {
                      // Descending → No sort
                      column.clearSorting();
                    }
                  }}
                  className={cn(
                    "h-auto p-1 font-semibold transition-all duration-200",
                    "hover:bg-slate-100 hover:text-slate-900",
                    "focus:outline-none",
                    "group"
                  )}
                >
                  <span className="mr-1">{col.name}</span>
                  <div className="relative ml-1 flex items-center">
                    {!isSorted && (
                      <ArrowUpDown
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          "text-slate-400 group-hover:text-slate-600",
                          "group-focus:text-slate-700"
                        )}
                      />
                    )}
                    {sortDirection === "asc" && (
                      <ChevronUp
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          "text-blue-600 group-hover:text-blue-700",
                          "group-focus:text-blue-800"
                        )}
                      />
                    )}
                    {sortDirection === "desc" && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          "text-blue-600 group-hover:text-blue-700",
                          "group-focus:text-blue-800"
                        )}
                      />
                    )}
                  </div>
                </Button>
              );
            } else {
              return col.name;
            }
          },
          cell: ({ getValue, row, column }) => {
            const value = getValue();
            const columnIndex = adapterOutput.columnOrder.indexOf(col.id);
            const position = createCellPosition(row.index, columnIndex);
            const isTotal =
              String(row.original.product).toLowerCase() === "total";

            // Get metadata from adapter output using correct key format
            const cellKey = generateCellKey(REPORT_ID, row.index, columnIndex);
            const metadata =
              adapterOutput.cellMetadata.get(cellKey) ||
              getMetadataForCell(col.id, col.originalSection, isTotal);

            return (
              <SpreadsheetCell
                rawValue={value}
                metadata={metadata}
                position={position}
                columnKey={col.originalKey}
                size={column.getSize()}
              />
            );
          },
          enableSorting: true,
        });

        groupColumns.push(column as ColumnDef<FlattenedRow>);
      }

      // Create group for data sections
      if (groupColumns.length > 0) {
        const groupColumn = columnHelper.group({
          id: section.name,
          header: section.name,
          columns: groupColumns,
        });

        columns.push(groupColumn);
      }
    }
  }

  return columns;
};
