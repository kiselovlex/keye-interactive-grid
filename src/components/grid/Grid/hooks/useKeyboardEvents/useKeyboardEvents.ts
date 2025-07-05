import { useEffect } from "react";
import type { UseSelectionReturn } from "../useSelection/types";
import type { UseEditDataReturn } from "../useEditData/types";
import type { CellFormatting, CellMetadata, CellPosition } from "@/components/grid/types/common";
import { applyFormattingToSelection, applyAlignmentToSelection } from "./utils";

const useKeyboardEvents = ({
  selectionHook,
  editHook,
  totalRows,
  totalColumns,
  updateCellFormatting,
  cellMetadata,
  updateMultipleCellsFormatting,
}: {
  selectionHook: UseSelectionReturn,
  editHook: UseEditDataReturn,
  totalRows: number,
  totalColumns: number,
  updateCellFormatting: (row: number, column: number, formatting: Partial<CellFormatting>) => Promise<void>,
  cellMetadata: Map<string, CellMetadata>,
  updateMultipleCellsFormatting?: (cellUpdates: Array<{
    position: CellPosition;
    formatting: Partial<CellFormatting>;
  }>) => Promise<void>,
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          const currentCell = selectionHook.getCurrentCell();
          if (!currentCell) return;
    
          // Check if we're in edit mode
          const isEditing = editHook.editingCell !== null;
    
          if (isEditing) {
            // Handle editing mode keyboard events
            switch (e.key) {
              case "Enter":
                e.preventDefault();
                if (editHook.isEditValid) {
                  void editHook.saveEdit();
                }
                break;
              case "Escape":
                e.preventDefault();
                editHook.cancelEdit();
                break;
              case "Tab":
                e.preventDefault();
                if (editHook.isEditValid) {
                  void editHook.saveEdit().then(() => {
                    // Navigate after saving
                    if (e.shiftKey) {
                      // Move left if possible
                      if (currentCell.column > 0) {
                        selectionHook.selectCell({
                          ...currentCell,
                          column: currentCell.column - 1,
                        });
                      }
                    } else {
                      // Move right if possible
                      if (currentCell.column < totalColumns - 1) {
                        selectionHook.selectCell({
                          ...currentCell,
                          column: currentCell.column + 1,
                        });
                      }
                    }
                  });
                }
                break;
            }
          } else {
            // Handle formatting shortcuts first (Ctrl+B, Ctrl+I, Alt+Shift+5)
            const key = e.key.toLowerCase();
    
            // Check for Ctrl/Cmd + B or I (bold/italic)
            if ((e.ctrlKey || e.metaKey) && (key === "b" || key === "i")) {
              e.preventDefault();
    
                          // Apply the appropriate formatting
            if (key === "b") {
              applyFormattingToSelection(selectionHook, "bold", updateCellFormatting, cellMetadata, updateMultipleCellsFormatting);
            } else if (key === "i") {
              applyFormattingToSelection(selectionHook, "italic", updateCellFormatting, cellMetadata, updateMultipleCellsFormatting);
            }
    
              return;
            }
    
            // Check for Ctrl+Shift+S (strikethrough) - more reliable than Alt combinations
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "s") {
              e.preventDefault();
              applyFormattingToSelection(selectionHook, "strikethrough", updateCellFormatting, cellMetadata, updateMultipleCellsFormatting);
              return;
            }
    
            // Check for Ctrl+Shift+L/E/R (alignment shortcuts)
            if (
              (e.ctrlKey || e.metaKey) &&
              e.shiftKey &&
              (key === "l" || key === "e" || key === "r")
            ) {
              e.preventDefault();
    
                          // Apply the appropriate alignment
            if (key === "l") {
              applyAlignmentToSelection(selectionHook, "left", updateCellFormatting, updateMultipleCellsFormatting);
            } else if (key === "e") {
              applyAlignmentToSelection(selectionHook, "center", updateCellFormatting, updateMultipleCellsFormatting);
            } else if (key === "r") {
              applyAlignmentToSelection(selectionHook, "right", updateCellFormatting, updateMultipleCellsFormatting);
            }
    
              return;
            }
    
            // Handle navigation mode keyboard events
            switch (e.key) {
              case "Escape": {
                e.preventDefault();
                selectionHook.clearSelection();
                break;
              }
              case "Tab": {
                e.preventDefault();
    
                // Check if we have a range selected and try to navigate within it
                const didNavigateWithinRange = selectionHook.navigateWithinRange(
                  e.shiftKey ? "previous" : "next"
                );
    
                if (!didNavigateWithinRange) {
                  // No range selected or at range boundary, do normal navigation
                  if (e.shiftKey) {
                    // Move left if possible
                    if (currentCell.column > 0) {
                      selectionHook.selectCell({
                        ...currentCell,
                        column: currentCell.column - 1,
                      });
                    }
                  } else {
                    // Move right if possible
                    if (currentCell.column < totalColumns - 1) {
                      selectionHook.selectCell({
                        ...currentCell,
                        column: currentCell.column + 1,
                      });
                    }
                  }
                }
                break;
              }
              case "Enter":
              case "F2": {
                e.preventDefault();
                // Use the active cell (which could be different from currentCell in range selections)
                const activeCell = selectionHook.getActiveCell();
                if (activeCell) {
                  editHook.startEdit(activeCell);
                }
                break;
              }
              case "ArrowLeft":
                e.preventDefault();
                if (currentCell.column > 0) {
                  selectionHook.selectCell({
                    ...currentCell,
                    column: currentCell.column - 1,
                  });
                }
                break;
              case "ArrowRight":
                e.preventDefault();
                if (currentCell.column < totalColumns - 1) {
                  selectionHook.selectCell({
                    ...currentCell,
                    column: currentCell.column + 1,
                  });
                }
                break;
              case "ArrowUp":
                e.preventDefault();
                if (currentCell.row > 0) {
                  selectionHook.selectCell({
                    ...currentCell,
                    row: currentCell.row - 1,
                  });
                }
                break;
              case "ArrowDown":
                e.preventDefault();
                if (currentCell.row < totalRows - 1) {
                  selectionHook.selectCell({
                    ...currentCell,
                    row: currentCell.row + 1,
                  });
                }
                break;
            }
          }
        };
    
        // Add event listener to document
        document.addEventListener("keydown", handleKeyDown);
    
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
        };
      }, [
        selectionHook,
        editHook,
        totalRows,
        totalColumns,
        updateCellFormatting,
        cellMetadata,
        updateMultipleCellsFormatting,
      ]);
};

export default useKeyboardEvents;