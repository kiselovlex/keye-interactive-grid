import {
  SelectionProvider,
  type SelectionContextValue,
} from "@/components/grid/contexts/SelectionContext";
import type { Table } from "@tanstack/react-table";
import type { FlattenedRow } from "@/components/grid/Grid/hooks/useReportData/utils";
import type { FC, RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import VirtualizedTableRow from "./components/VirtualizedTableRow/VirtualizedTableRow";
import { safeStringify } from "@/components/grid/utils/formatting";
import { TableBody } from "@/components/ui/table";

interface VirtualizedTableBodyProps {
  table: Table<FlattenedRow>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
  selectionContextValue: SelectionContextValue;
}

const VirtualizedTableBody: FC<VirtualizedTableBodyProps> = ({
  table,
  tableContainerRef,
  selectionContextValue,
}) => {
  const { rows } = table.getRowModel();

  // Row virtualizer with better sizing
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 15,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <SelectionProvider value={selectionContextValue}>
      <TableBody
        style={{
          display: "grid",
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
          borderCollapse: "collapse",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          const isTotal =
            safeStringify(row.original.product).toLowerCase() === "total";

          return (
            <VirtualizedTableRow
              key={row.id}
              row={row}
              virtualRow={virtualRow}
              isTotal={isTotal}
            />
          );
        })}
      </TableBody>
    </SelectionProvider>
  );
};

export default VirtualizedTableBody;
