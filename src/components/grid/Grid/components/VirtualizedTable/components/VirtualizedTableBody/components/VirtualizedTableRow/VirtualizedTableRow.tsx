import type { FlattenedRow } from "@/components/grid/Grid/hooks/useReportData/utils";
import { TableRow } from "@/components/ui/table";
import { flexRender, type Row } from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import React from "react";

interface VirtualizedTableRowProps {
  row: Row<FlattenedRow>;
  virtualRow: VirtualItem;
  isTotal: boolean;
}

const VirtualizedTableRow: React.FC<VirtualizedTableRowProps> = ({
  row,
  virtualRow,
  isTotal,
}) => {
  return (
    <TableRow
      data-index={virtualRow.index}
      style={{
        display: "flex",
        position: "absolute",
        transform: `translateY(${virtualRow.start}px)`,
        width: "100%",
        minHeight: "40px",
      }}
      className={`transition-colors border-b border-slate-200 dark:border-slate-700 ${
        isTotal
          ? "bg-slate-100 dark:bg-slate-800 font-semibold border-t-2 border-slate-300 dark:border-slate-600"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900"
      }`}
    >
      {row.getVisibleCells().map((cell) => (
        <React.Fragment key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </React.Fragment>
      ))}
    </TableRow>
  );
};

export default VirtualizedTableRow;
