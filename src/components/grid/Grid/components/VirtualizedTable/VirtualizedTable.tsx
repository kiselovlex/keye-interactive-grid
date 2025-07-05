import type { FlattenedRow } from "@/components/grid/Grid/hooks/useReportData/utils";
import type { SelectionContextValue } from "@/components/grid/contexts/SelectionContext";
import type { Table } from "@tanstack/react-table";
import VirtualizedTableHeader from "./components/VirtualizedTableHeader/VirtualizedTableHeader";
import VirtualizedTableBody from "./components/VirtualizedTableBody/VirtualizedTableBody";
import { Table as TableUI } from "@/components/ui/table";

interface VirtualizedTableProps {
  table: Table<FlattenedRow>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  selectionContextValue: SelectionContextValue;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  table,
  tableContainerRef,
  selectionContextValue,
}) => {
  // Calculate responsive height (70% of viewport minus some padding for better fit)
  const containerHeight = `calc(70vh - 100px)`;

  return (
    <div
      ref={tableContainerRef}
      className="relative overflow-auto border rounded-md bg-card"
      style={{
        height: containerHeight,
        minHeight: "400px",
        maxHeight: "800px",
      }}
    >
      {/* Use CSS grid for table structure to support virtualization */}
      <TableUI
        style={{ display: "grid", height: "100%", borderCollapse: "collapse" }}
      >
        <VirtualizedTableHeader table={table} />
        <VirtualizedTableBody
          table={table}
          tableContainerRef={tableContainerRef}
          selectionContextValue={selectionContextValue}
        />
      </TableUI>
    </div>
  );
};

export default VirtualizedTable;
