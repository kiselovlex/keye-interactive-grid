import type { FlattenedRow } from "@/components/grid/Grid/hooks/useReportData/utils";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flexRender, type Table } from "@tanstack/react-table";

interface VirtualizedTableHeaderProps {
  table: Table<FlattenedRow>;
}

const VirtualizedTableHeader: React.FC<VirtualizedTableHeaderProps> = ({
  table,
}) => {
  return (
    <TableHeader
      style={{
        display: "grid",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
      className="bg-slate-50 dark:bg-slate-800 border-b"
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow
          key={headerGroup.id}
          style={{ display: "flex", width: "100%" }}
        >
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className="font-semibold text-slate-900 dark:text-slate-100 px-4 py-3 text-left border-r border-slate-200 dark:border-slate-700 last:border-r-0 bg-slate-50 dark:bg-slate-800"
              style={{
                display: "flex",
                alignItems: "center",
                width: header.getSize(),
                minWidth: header.getSize(),
              }}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
};

export default VirtualizedTableHeader;
