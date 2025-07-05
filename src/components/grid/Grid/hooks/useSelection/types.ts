import type { CellPosition, SelectionState } from "@/components/grid/types/common";

export interface UseSelectionReturn {
    selectionState: SelectionState;
    selectCell: (position: CellPosition) => void;
    selectRange: (start: CellPosition, end: CellPosition) => void;
    toggleCellSelection: (position: CellPosition) => void;
    startSelection: (position: CellPosition) => void;
    updateSelection: (position: CellPosition) => void;
    endSelection: () => void;
    clearSelection: () => void;
    isCellSelected: (position: CellPosition) => boolean;
    isCellInRange: (position: CellPosition) => boolean;
    getCurrentCell: () => CellPosition | null;
    getActiveCell: () => CellPosition | null;
    navigateWithinRange: (direction: 'next' | 'previous') => boolean;
  }