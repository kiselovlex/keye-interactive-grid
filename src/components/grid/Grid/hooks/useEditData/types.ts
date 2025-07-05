import type { AdapterOutput } from "@/components/grid/Grid/hooks/useReportData/utils";
import type { CellPosition } from "@/components/grid/types/common";

export interface UseEditDataProps {
    data: AdapterOutput;
    onDataUpdate: (updatedData: AdapterOutput) => void;
  }
  
export interface UseEditDataReturn {
    // State
    editingCell: CellPosition | null;
    editValue: string;
    isEditValid: boolean;
    editError: string | null;
    isSaving: boolean;

    // Methods
    startEdit: (position: CellPosition) => void;
    cancelEdit: () => void;
    saveEdit: () => Promise<void>;
    updateEditValue: (value: string) => void;
    isCellEditing: (position: CellPosition) => boolean;
}