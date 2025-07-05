import { useState, useCallback } from 'react';
import type { CellPosition, SelectionState, CellRange } from '../../../types/common';
import type { UseSelectionReturn } from './types';



/**
 * useSelection - Custom hook for managing cell selection
 * Handles single cell selection, range selection, and visual feedback
 */
export const useSelection = (): UseSelectionReturn => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedCells: null,
    isSelecting: false,
    selectionStart: null,
    activeCell: null,
  });

  /**
   * Select a single cell (serves as anchor for future shift+click operations)
   */
  const selectCell = useCallback((position: CellPosition) => {
    setSelectionState({
      selectedCells: {
        type: 'single',
        single: position,
      },
      isSelecting: false,
      selectionStart: null,
      activeCell: position, // Active cell is the selected cell
    });
  }, []);

  /**
   * Select a range of cells
   */
  const selectRange = useCallback((start: CellPosition, end: CellPosition) => {
    const range: CellRange = { start, end };
    setSelectionState(prev => ({
      ...prev,
      selectedCells: {
        type: 'range',
        range,
      },
      isSelecting: false,
      selectionStart: null,
      activeCell: start, // Active cell is the start of the range
    }));
  }, []);

  /**
   * Toggle cell selection for Ctrl+Click multi-select
   */
  const toggleCellSelection = useCallback((position: CellPosition) => {
    setSelectionState(prev => {
      const { selectedCells } = prev;

      // If no cells are selected, select this cell
      if (!selectedCells) {
        return {
          ...prev,
          selectedCells: {
            type: 'single',
            single: position,
          },
        };
      }

      // If single cell is selected
      if (selectedCells.type === 'single' && selectedCells.single) {
        const isSameCell = 
          selectedCells.single.row === position.row &&
          selectedCells.single.column === position.column;

        // If clicking the same cell, deselect it
        if (isSameCell) {
          return {
            ...prev,
            selectedCells: null,
          };
        }

        // If clicking a different cell, create multiple selection
        return {
          ...prev,
          selectedCells: {
            type: 'multiple',
            multiple: [selectedCells.single, position],
          },
        };
      }

      // If multiple cells are selected
      if (selectedCells.type === 'multiple' && selectedCells.multiple) {
        const existingIndex = selectedCells.multiple.findIndex(cell =>
          cell.row === position.row && cell.column === position.column
        );

        // If cell is already selected, remove it
        if (existingIndex !== -1) {
          const newMultiple = selectedCells.multiple.filter((_, index) => index !== existingIndex);
          
          // If only one cell remains, convert back to single selection
          if (newMultiple.length === 1) {
            return {
              ...prev,
              selectedCells: {
                type: 'single',
                single: newMultiple[0],
              },
            };
          }

          // If no cells remain, clear selection
          if (newMultiple.length === 0) {
            return {
              ...prev,
              selectedCells: null,
            };
          }

          // Otherwise, keep multiple selection
          return {
            ...prev,
            selectedCells: {
              type: 'multiple',
              multiple: newMultiple,
            },
          };
        }

        // If cell is not selected, add it
        return {
          ...prev,
          selectedCells: {
            type: 'multiple',
            multiple: [...selectedCells.multiple, position],
          },
        };
      }

      // If range is selected, convert to multiple selection with just this cell
      if (selectedCells.type === 'range') {
        return {
          ...prev,
          selectedCells: {
            type: 'single',
            single: position,
          },
        };
      }

      return prev;
    });
  }, []);

  /**
   * Start a range selection (mouse down)
   */
  const startSelection = useCallback((position: CellPosition) => {
    setSelectionState(prev => ({
      ...prev,
      isSelecting: true,
      selectionStart: position,
      selectedCells: {
        type: 'single',
        single: position,
      },
      activeCell: position,
    }));
  }, []);

  /**
   * Update selection during drag (mouse move)
   */
  const updateSelection = useCallback((position: CellPosition) => {
    setSelectionState(prev => {
      if (!prev.isSelecting || !prev.selectionStart) {
        return prev;
      }

      // If dragging to the same cell, keep it as single selection
      if (
        prev.selectionStart.row === position.row &&
        prev.selectionStart.column === position.column
      ) {
        return {
          ...prev,
          selectedCells: {
            type: 'single',
            single: position,
          },
          activeCell: position,
        };
      }

      // Create range selection
      const range: CellRange = {
        start: prev.selectionStart,
        end: position,
      };

      return {
        ...prev,
        selectedCells: {
          type: 'range',
          range,
        },
        activeCell: prev.selectionStart, // Active cell is where selection started
      };
    });
  }, []);

  /**
   * End selection (mouse up)
   */
  const endSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      isSelecting: false,
      selectionStart: null,
    }));
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectionState({
      selectedCells: null,
      isSelecting: false,
      selectionStart: null,
      activeCell: null,
    });
  }, []);

  /**
   * Check if a specific cell is selected
   */
  const isCellSelected = useCallback((position: CellPosition): boolean => {
    const { selectedCells } = selectionState;
    if (!selectedCells) return false;

    if (selectedCells.type === 'single' && selectedCells.single) {
      return (
        selectedCells.single.row === position.row &&
        selectedCells.single.column === position.column
      );
    }

    if (selectedCells.type === 'range' && selectedCells.range) {
      // For range selection, we return true only for the start and end cells
      // The component handles the full range detection with proper column ordering
      const { start, end } = selectedCells.range;
      return (
        (start.row === position.row && start.column === position.column) ||
        (end.row === position.row && end.column === position.column)
      );
    }

    if (selectedCells.type === 'multiple' && selectedCells.multiple) {
      return selectedCells.multiple.some(cell =>
        cell.row === position.row &&
        cell.column === position.column
      );
    }

    return false;
  }, [selectionState]);

  /**
   * Check if a specific cell is in the selected range
   */
  const isCellInRange = useCallback((position: CellPosition): boolean => {
    const { selectedCells } = selectionState;
    if (!selectedCells || selectedCells.type !== "range") {
      return false;
    }

    const range = selectedCells.range;
    if (!range) return false;

    const { start, end } = range;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.column, end.column);
    const maxCol = Math.max(start.column, end.column);

    return position.row >= minRow && position.row <= maxRow &&
           position.column >= minCol && position.column <= maxCol;
  }, [selectionState]);

  /**
   * Get current single selected cell (for backward compatibility)
   */
  const getCurrentCell = useCallback((): CellPosition | null => {
    if (selectionState.selectedCells?.type === 'single') {
      return selectionState.selectedCells.single ?? null;
    }
    // For range selections, return the active cell
    return selectionState.activeCell;
  }, [selectionState]);

  /**
   * Get the active cell (the one that would be edited)
   */
  const getActiveCell = useCallback((): CellPosition | null => {
    return selectionState.activeCell;
  }, [selectionState]);

  /**
   * Navigate within a selected range using Tab/Shift+Tab
   * Returns true if navigation happened, false if at boundary
   */
  const navigateWithinRange = useCallback((direction: 'next' | 'previous'): boolean => {
    const { selectedCells, activeCell } = selectionState;
    
    if (!selectedCells || selectedCells.type !== 'range' || !selectedCells.range || !activeCell) {
      return false; // Not in range selection mode
    }
    
    const { start, end } = selectedCells.range;
    
    // Calculate range boundaries
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.column, end.column);
    const maxCol = Math.max(start.column, end.column);
    
    let newActiveCell: CellPosition;
    
    if (direction === 'next') {
      // Tab: move right, then wrap to next row
      if (activeCell.column < maxCol) {
        // Move right within current row
        newActiveCell = { ...activeCell, column: activeCell.column + 1 };
      } else if (activeCell.row < maxRow) {
        // Wrap to first column of next row
        newActiveCell = { row: activeCell.row + 1, column: minCol };
      } else {
        // At bottom-right, wrap to top-left
        newActiveCell = { row: minRow, column: minCol };
      }
    } else {
      // Shift+Tab: move left, then wrap to previous row
      if (activeCell.column > minCol) {
        // Move left within current row
        newActiveCell = { ...activeCell, column: activeCell.column - 1 };
      } else if (activeCell.row > minRow) {
        // Wrap to last column of previous row
        newActiveCell = { row: activeCell.row - 1, column: maxCol };
      } else {
        // At top-left, wrap to bottom-right
        newActiveCell = { row: maxRow, column: maxCol };
      }
    }
    
    // Update active cell
    setSelectionState(prev => ({
      ...prev,
      activeCell: newActiveCell,
    }));
    
    return true;
  }, [selectionState]);

  return {
    selectionState,
    selectCell,
    selectRange,
    toggleCellSelection,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    isCellSelected,
    isCellInRange,
    getCurrentCell,
    getActiveCell,
    navigateWithinRange,
  };
}; 