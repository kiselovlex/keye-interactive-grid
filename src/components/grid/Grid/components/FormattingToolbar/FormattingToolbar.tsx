import * as React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CellFormatting, CellMetadata } from "../../../types/common";
import type { UseSelectionReturn } from "../../hooks/useSelection/types";
import {
  applyFormattingToSelection,
  applyAlignmentToSelection,
  getSelectedCells,
} from "../../hooks/useKeyboardEvents/utils";
import { generateCellKey } from "@/components/grid/utils/formatting";
import { REPORT_ID } from "@/api";

interface FormattingToolbarProps {
  selectionHook: UseSelectionReturn;
  updateCellFormatting: (
    row: number,
    column: number,
    formatting: Partial<CellFormatting>
  ) => Promise<void>;
  cellMetadata: Map<string, CellMetadata>;
  targetRef?: React.RefObject<HTMLElement | null>;
}

interface ToolbarPosition {
  x: number;
  y: number;
  show: boolean;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  selectionHook,
  updateCellFormatting,
  cellMetadata,
  targetRef,
}) => {
  const [position, setPosition] = React.useState<ToolbarPosition>({
    x: 0,
    y: 0,
    show: false,
  });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const selectedCells = getSelectedCells(selectionHook);
  const hasSelection = selectedCells.length > 0;
  const isSelecting = selectionHook.selectionState?.isSelecting || false;

  // Get current formatting state for active selection
  const getFormattingState = React.useCallback(() => {
    if (selectedCells.length === 0)
      return {
        bold: false,
        italic: false,
        strikethrough: false,
        alignment: null,
      };

    // Check if all selected cells have the same formatting
    const firstCell = selectedCells[0];
    const firstCellKey = generateCellKey(
      REPORT_ID,
      firstCell.row,
      firstCell.column
    );
    const firstCellMetadata = cellMetadata.get(firstCellKey);

    const bold = firstCellMetadata?.formatting?.bold || false;
    const italic = firstCellMetadata?.formatting?.italic || false;
    const strikethrough = firstCellMetadata?.formatting?.strikethrough || false;
    const alignment = firstCellMetadata?.formatting?.alignment || null;

    return { bold, italic, strikethrough, alignment };
  }, [selectedCells, cellMetadata]);

  const formattingState = getFormattingState();

  // Calculate toolbar position
  const updatePosition = React.useCallback(() => {
    if (!hasSelection || isSelecting || !targetRef?.current) {
      setPosition((prev) => ({ ...prev, show: false }));
      return;
    }

    const activeCell = selectionHook.getActiveCell();
    if (!activeCell) {
      setPosition((prev) => ({ ...prev, show: false }));
      return;
    }

    // Find the active cell element in the DOM
    const tableContainer = targetRef.current;
    const cellElement = tableContainer.querySelector(
      `[data-cell-position="${activeCell.row}-${activeCell.column}"]`
    ) as HTMLElement;

    if (!cellElement) {
      setPosition((prev) => ({ ...prev, show: false }));
      return;
    }

    const cellRect = cellElement.getBoundingClientRect();
    const containerRect = tableContainer.getBoundingClientRect();

    // Calculate toolbar dimensions (approximate)
    const toolbarWidth = 240;
    const toolbarHeight = 40;
    const offset = 10;

    // Calculate relative position within container
    const cellCenterX = cellRect.left - containerRect.left + cellRect.width / 2;
    const cellTop = cellRect.top - containerRect.top;
    const cellBottom = cellRect.bottom - containerRect.top;

    // Position toolbar above cell by default
    let x = cellCenterX - toolbarWidth / 2;
    let y = cellTop - toolbarHeight - offset;

    // Ensure toolbar stays within container bounds horizontally
    const containerWidth = containerRect.width;
    if (x < offset) {
      x = offset;
    } else if (x + toolbarWidth > containerWidth - offset) {
      x = containerWidth - toolbarWidth - offset;
    }

    // If toolbar would go above container, position it below the cell
    if (y < offset) {
      y = cellBottom + offset;
    }

    setPosition({ x, y, show: true });
  }, [hasSelection, isSelecting, targetRef, selectionHook]);

  // Update position when selection changes
  React.useEffect(() => {
    updatePosition();
  }, [updatePosition, selectionHook.selectionState]);

  // Update position on scroll
  React.useEffect(() => {
    const container = targetRef?.current;
    if (!container) return;

    const handleScroll = () => {
      if (position.show) {
        updatePosition();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [targetRef, position.show, updatePosition]);

  // Handle formatting button clicks
  const handleFormatting = React.useCallback(
    (type: "bold" | "italic" | "strikethrough") => {
      applyFormattingToSelection(
        selectionHook,
        type,
        updateCellFormatting,
        cellMetadata
      );
    },
    [selectionHook, updateCellFormatting, cellMetadata]
  );

  const handleAlignment = React.useCallback(
    (alignment: "left" | "center" | "right") => {
      applyAlignmentToSelection(selectionHook, alignment, updateCellFormatting);
    },
    [selectionHook, updateCellFormatting]
  );

  if (!position.show) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "absolute z-50 flex items-center gap-1 bg-popover border rounded-lg p-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Text Formatting */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={formattingState.bold ? "default" : "ghost"}
            size="sm"
            onClick={() => handleFormatting("bold")}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bold (Ctrl+B)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={formattingState.italic ? "default" : "ghost"}
            size="sm"
            onClick={() => handleFormatting("italic")}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Italic (Ctrl+I)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={formattingState.strikethrough ? "default" : "ghost"}
            size="sm"
            onClick={() => handleFormatting("strikethrough")}
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Strikethrough (Ctrl+Shift+S)</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={formattingState.alignment === "left" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleAlignment("left")}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Align Left (Ctrl+Shift+L)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={
              formattingState.alignment === "center" ? "default" : "ghost"
            }
            size="sm"
            onClick={() => handleAlignment("center")}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Align Center (Ctrl+Shift+E)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={
              formattingState.alignment === "right" ? "default" : "ghost"
            }
            size="sm"
            onClick={() => handleAlignment("right")}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Align Right (Ctrl+Shift+R)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export { FormattingToolbar };
