import { createContext, use } from "react";
import type { ReactNode } from "react";
import type { SelectionState, CellPosition } from "../types/common";

export interface SelectionContextValue {
  // Selection state
  selectionState: SelectionState;
  selectCell: (position: CellPosition) => void;
  selectRange: (start: CellPosition, end: CellPosition) => void;
  startSelection: (position: CellPosition) => void;
  updateSelection: (position: CellPosition) => void;
  endSelection: () => void;
  clearSelection: () => void;
  isCellSelected: (position: CellPosition) => boolean;
  isCellInRange: (position: CellPosition) => boolean;
  toggleCellSelection: (position: CellPosition) => void;
  getCurrentCell: () => CellPosition | null;
  getActiveCell: () => CellPosition | null;
  navigateWithinRange: (direction: "next" | "previous") => boolean;

  // Grid dimensions
  totalRows: number;
  totalColumns: number;

  // Edit state
  editingCell: CellPosition | null;
  editValue: string;
  isEditValid: boolean;
  editError: string | null;
  isSaving: boolean;

  // Edit methods
  startEdit: (position: CellPosition) => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  updateEditValue: (value: string) => void;
  isCellEditing: (position: CellPosition) => boolean;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export const useSelectionContext = () => {
  const context = use(SelectionContext);
  if (!context) {
    throw new Error(
      "useSelectionContext must be used within SelectionProvider"
    );
  }
  return context;
};

interface SelectionProviderProps {
  children: ReactNode;
  value: SelectionContextValue;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({
  children,
  value,
}) => {
  return <SelectionContext value={value}>{children}</SelectionContext>;
};
