import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  formatValue,
  getCellClasses,
  getGrowthIndicator,
} from "../../../utils/formatting";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import type { CellPosition, CellMetadata } from "../../../types/common";
import { useEventCallback } from "usehooks-ts";
import { useSelectionContext } from "../../../contexts/SelectionContext";
import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  // Raw data and metadata
  rawValue: string | number;
  metadata: CellMetadata;
  position: CellPosition;

  // Additional styling props
  isRowIndex?: boolean;
  hasSectionBorder?: boolean;

  // For API operations
  columnKey?: string;
  size?: number;
}

// Cell variant styles using cva
const cellVariants = cva(
  // Base classes
  "min-h-8 border border-gray-200 dark:border-gray-700 select-none transition-colors",
  {
    variants: {
      // Selection states
      selection: {
        none: "hover:bg-gray-50 dark:hover:bg-gray-800",
        selected:
          "bg-blue-100 dark:bg-blue-900 outline outline-2 outline-blue-600 outline-offset-[-1px] z-10",
        inRange:
          "bg-blue-50 dark:bg-blue-950 outline outline-1 outline-blue-300 outline-offset-[-1px] z-[5]",
        rangeEndpoint:
          "bg-orange-100 dark:bg-orange-900 outline outline-2 outline-orange-500 outline-offset-[-1px] z-[15]",
        activeInRange:
          "bg-blue-200 dark:bg-blue-800 outline outline-2 outline-blue-600 outline-offset-[-1px] z-20",
      },
      // Editing states
      editing: {
        false: "p-2",
        true: "outline outline-2 outline-blue-500 outline-offset-[-1px] bg-white dark:bg-gray-800 p-0 z-40",
      },
      // Validation states
      validation: {
        valid: "",
        invalid:
          "outline outline-2 outline-red-500 outline-offset-[-1px] bg-red-50 dark:bg-red-900 z-30",
      },
      // Cell type variants
      cellType: {
        normal: "",
        rowIndex: "w-12 text-center p-0",
      },
      // Special states
      saving: {
        false: "",
        true: "opacity-50",
      },
      // Section border
      sectionBorder: {
        false: "",
        true: "border-l-2 border-slate-300",
      },
    },
    defaultVariants: {
      selection: "none",
      editing: false,
      validation: "valid",
      cellType: "normal",
      saving: false,
      sectionBorder: false,
    },
  }
);

// Type for cell variant props
type CellVariantProps = VariantProps<typeof cellVariants>;

/**
 * SpreadsheetCell - Dumb component for rendering individual cells
 * Gets all state from context and only handles mouse events
 * All keyboard events are handled at the grid level
 */
const SpreadsheetCell: React.FC<SpreadsheetCellProps> = (
  props: SpreadsheetCellProps
) => {
  const {
    rawValue,
    metadata,
    position,
    isRowIndex = false,
    hasSectionBorder = false,
    size,
  } = props;

  // Get all state from context
  const {
    selectionState,
    selectCell,
    selectRange,
    toggleCellSelection,
    startSelection,
    updateSelection,
    endSelection,
    isCellSelected,
    isCellInRange,
    getActiveCell,
    // Edit state
    startEdit,
    updateEditValue,
    editValue,
    isEditValid,
    editError,
    isSaving,
    isCellEditing,
  } = useSelectionContext();

  // Compute selection state
  const isSelected = isCellSelected(position);
  const isInRange = isCellInRange(position);
  const isEditing = isCellEditing(position);
  const isRangeEndpoint =
    selectionState?.selectedCells?.type === "range" && isSelected;

  // Check if this cell is the active cell (for range selections)
  const activeCell = getActiveCell();
  const isActiveCell =
    activeCell &&
    activeCell.row === position.row &&
    activeCell.column === position.column;

  // Format the value using the uniform formatter
  const formattedValue = formatValue(rawValue, metadata);

  // Get base CSS classes from metadata
  const baseCellClasses = getCellClasses(metadata);

  if (isActiveCell) {
    console.log("metadata", metadata);
    console.log("isActiveCell", isActiveCell);
  }

  // Determine selection variant
  const getSelectionVariant = (): CellVariantProps["selection"] => {
    if (isActiveCell && selectionState?.selectedCells?.type === "range") {
      return "activeInRange";
    }
    if (isSelected && !isInRange) {
      return "selected";
    }
    if (isRangeEndpoint) {
      return "rangeEndpoint";
    }
    if (isInRange) {
      return "inRange";
    }
    return "none";
  };

  // Get growth indicator for YoY Growth section
  const getGrowthAttributes = () => {
    if (metadata.section === "YoY Growth") {
      const indicator = getGrowthIndicator(rawValue);
      return { "data-growth": indicator };
    }
    return {};
  };

  // Generate cell classes using cva and cn
  const cellClasses = cn(
    cellVariants({
      selection: getSelectionVariant(),
      editing: isEditing,
      validation: isEditing && !isEditValid ? "invalid" : "valid",
      cellType: isRowIndex ? "rowIndex" : "normal",
      saving: isSaving,
      sectionBorder: hasSectionBorder,
    }),
    baseCellClasses
  );

  // Get consistent cell content styling
  const getCellContentStyle = () => {
    const alignment =
      metadata.formatting?.alignment ||
      (metadata.type === "currency" ||
      metadata.type === "percentage" ||
      metadata.type === "number"
        ? "right"
        : "left");

    // Convert textAlign to flex properties since TableCell uses flexbox
    let justifyContent: string;
    switch (alignment) {
      case "right":
        justifyContent = "flex-end";
        break;
      case "center":
        justifyContent = "center";
        break;
      case "left":
      default:
        justifyContent = "flex-start";
        break;
    }

    return {
      justifyContent,
      alignItems: "center", // Center vertically
      fontFamily:
        metadata.type === "currency" ||
        metadata.type === "percentage" ||
        metadata.type === "number"
          ? "monospace"
          : "inherit",
    } as React.CSSProperties;
  };

  // Handle click events
  const handleClick = useEventCallback((e: React.MouseEvent) => {
    console.log("click");

    // Don't handle clicks during editing
    if (isEditing) return;

    // Handle Ctrl+click for multiple selection
    if (e.ctrlKey || e.metaKey) {
      console.log("✅ Ctrl+click: Toggle cell selection");
      toggleCellSelection(position);
      return;
    }

    // Handle shift+click for range selection
    if (e.shiftKey) {
      const anchor =
        selectionState?.selectedCells?.type === "single"
          ? selectionState.selectedCells.single
          : null;

      if (anchor) {
        console.log("✅ Shift+click: Creating range from anchor");
        selectRange(anchor, position);
        return;
      }
    }

    // Regular click - select single cell
    selectCell(position);
  });

  // Handle double click to start editing
  const handleDoubleClick = useEventCallback(() => {
    console.log("double click");
    if (!isEditing) {
      startEdit(position);
    }
  });

  // Handle mouse down for drag selection
  const handleMouseDown = useEventCallback((e: React.MouseEvent) => {
    console.log("mouse down");
    if (!isEditing) {
      // Don't start drag selection if Ctrl or shift is pressed
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      // Start drag selection
      startSelection(position);
    }
  });

  // Handle mouse enter for drag selection
  const handleMouseEnter = useEventCallback(() => {
    console.log("mouse enter");
    if (!isEditing && selectionState?.isSelecting) {
      // Update selection during drag
      updateSelection(position);
    }
  });

  // Handle mouse up for drag selection
  const handleMouseUp = useEventCallback(() => {
    console.log("mouse up");
    if (!isEditing && selectionState?.isSelecting) {
      endSelection();
    }
  });

  // Handle edit input change
  const handleEditChange = useEventCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateEditValue(e.target.value);
    }
  );

  if (isEditing) {
    return (
      <TableCell
        className={cellClasses}
        data-cell-position={`${position.row}-${position.column}`}
        style={{
          display: "flex",
          flex: 1,
          width: size,
          minWidth: size,
        }}
      >
        <Input
          value={editValue}
          onChange={handleEditChange}
          className="border-none p-2 h-full w-full focus:ring-0 focus:border-none select-text bg-transparent"
          style={getCellContentStyle()}
          aria-label={`Edit cell at row ${position.row + 1}, column ${
            position.column
          }`}
          aria-invalid={!isEditValid}
          autoFocus
        />
        {editError && (
          <div className="absolute z-10 mt-1 text-xs text-red-600 bg-white dark:bg-gray-800 p-1 rounded shadow">
            {editError}
          </div>
        )}
      </TableCell>
    );
  }

  return (
    <TableCell
      className={cellClasses}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      // No onKeyDown - handled at grid level
      {...getGrowthAttributes()}
      role="gridcell"
      // No tabIndex - cells are not focusable
      aria-label={`Cell at row ${position.row + 1}, column ${
        position.column
      }: ${formattedValue}`}
      aria-selected={isSelected}
      data-cell-position={`${position.row}-${position.column}`}
      style={{
        display: "flex",
        flex: 1,
        width: size,
        minWidth: size,
        ...getCellContentStyle(),
      }}
    >
      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
        {formattedValue}
      </span>
    </TableCell>
  );
};

export { SpreadsheetCell };
