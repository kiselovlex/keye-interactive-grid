import type { CellMetadata, CellPosition, CellFormatting } from '../types/common';
import type { UseSelectionReturn } from '../Grid/hooks/useSelection/types';
import { REPORT_ID } from '@/api';

/**
 * Uniform cell formatter utilities that handle raw data and metadata
 * Each cell uses these formatters to display its content based on metadata
 */

/**
 * Helper function to generate cell key
 */
export const generateCellKey = (reportId: string, row: number, column: number): string => {
  return `${reportId}:${row}:${column}`;
};

/**
 * Gets all currently selected cells from the selection state
 */
export const getSelectedCells = (selectionHook: UseSelectionReturn): CellPosition[] => {
  const selectedCells = selectionHook.selectionState?.selectedCells;
  if (!selectedCells) return [];

  switch (selectedCells.type) {
    case "single":
      return selectedCells.single ? [selectedCells.single] : [];

    case "range": {
      if (!selectedCells.range) return [];
      const cells: CellPosition[] = [];
      const { start, end } = selectedCells.range;

      // Ensure start is top-left and end is bottom-right
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.column, end.column);
      const maxCol = Math.max(start.column, end.column);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ row, column: col });
        }
      }
      return cells;
    }

    case "multiple":
      return selectedCells.multiple || [];

    default:
      return [];
  }
};

/**
 * Applies formatting to all selected cells
 */
export const applyFormattingToSelection = (
  selectionHook: UseSelectionReturn,
  formattingType: "bold" | "italic" | "strikethrough",
  updateCellFormatting: (row: number, column: number, formatting: Partial<CellFormatting>) => Promise<void>,
  cellMetadata: Map<string, CellMetadata>,
  updateMultipleCellsFormatting?: (cellUpdates: Array<{
    position: CellPosition;
    formatting: Partial<CellFormatting>;
  }>) => Promise<void>
) => {
  const selectedCells = getSelectedCells(selectionHook);
  console.log("selectedCells", selectedCells);
  
  // Use batch update if available, otherwise fall back to individual updates
  if (updateMultipleCellsFormatting) {
    const cellUpdates = selectedCells.map((cell) => {
      // Get current formatting to toggle the specific property
      const cellKey = generateCellKey(REPORT_ID, cell.row, cell.column);
      const currentMetadata = cellMetadata.get(cellKey);
      const currentValue = currentMetadata?.formatting?.[formattingType] || false;
      
      return {
        position: cell,
        formatting: {
          [formattingType]: !currentValue,
        },
      };
    });
    
    void updateMultipleCellsFormatting(cellUpdates);
  } else {
    // Fallback to individual updates
    selectedCells.forEach((cell) => {
      // Get current formatting to toggle the specific property
      const cellKey = generateCellKey(REPORT_ID, cell.row, cell.column);
      const currentMetadata = cellMetadata.get(cellKey);
      const currentValue = currentMetadata?.formatting?.[formattingType] || false;
      
      void updateCellFormatting(cell.row, cell.column, {
        [formattingType]: !currentValue,
      });
    });
  }
};

/**
 * Applies alignment to all selected cells
 */
export const applyAlignmentToSelection = (
  selectionHook: UseSelectionReturn,
  alignment: "left" | "center" | "right",
  updateCellFormatting: (row: number, column: number, formatting: Partial<CellFormatting>) => Promise<void>,
  updateMultipleCellsFormatting?: (cellUpdates: Array<{
    position: CellPosition;
    formatting: Partial<CellFormatting>;
  }>) => Promise<void>
) => {
  const selectedCells = getSelectedCells(selectionHook);
  
  // Use batch update if available, otherwise fall back to individual updates
  if (updateMultipleCellsFormatting) {
    const cellUpdates = selectedCells.map((cell) => ({
      position: cell,
      formatting: {
        alignment: alignment,
      },
    }));
    
    void updateMultipleCellsFormatting(cellUpdates);
  } else {
    // Fallback to individual updates
    selectedCells.forEach((cell) => {
      void updateCellFormatting(cell.row, cell.column, {
        alignment: alignment,
      });
    });
  }
};

/**
 * Format a cell value based on its metadata
 */
export function formatValue(rawValue: string | number, metadata: CellMetadata): string {
  const { type } = metadata;
  
  switch (type) {
    case 'currency':
      return formatCurrency(rawValue);
    case 'percentage':
      return formatPercentage(rawValue);
    case 'number':
      return formatNumber(rawValue);
    case 'product':
      return formatProduct(rawValue);
    case 'text':
    default:
      return formatText(rawValue);
  }
}

/**
 * Format currency values
 */
export function formatCurrency(value: string | number): string {
  if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
    value = Number(value);
  }

  if (typeof value === 'number') {
    if (value === 0) return '$0';

    // Format large numbers in millions
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }

    // Format thousands with commas
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  return String(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: string | number): string {
  if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
    value = Number(value);
  }

  if (typeof value === 'number') {
    if (value === 0) return '0%';
    return `${value.toFixed(1)}%`;
  }

  return String(value);
}

/**
 * Format number values
 */
export function formatNumber(value: string | number): string {
  if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
    value = Number(value);
  }

  if (typeof value === 'number') {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}

/**
 * Format product names
 */
export function formatProduct(value: string | number): string {
  return String(value);
}

/**
 * Format text values
 */
export function formatText(value: string | number): string {
  return String(value);
}

/**
 * Get CSS classes for a cell based on its metadata
 */
export function getCellClasses(metadata: CellMetadata): string {
  const { type, section, formatting } = metadata;
  
  let classes = 'cursor-pointer select-none transition-colors';
  
  // Type-specific classes
  switch (type) {
    case 'currency':
    case 'percentage':
    case 'number':
      classes += ' text-right font-mono';
      break;
    case 'product':
      classes += ' text-left font-medium';
      break;
    case 'text':
    default:
      classes += ' text-left';
      break;
  }

  // Section-specific classes
  if (section === 'YoY Growth') {
    // Add color coding for growth values
    classes += ' data-[growth="positive"]:text-green-600 data-[growth="negative"]:text-red-600';
  }

  // Formatting classes
  if (formatting) {
    if (formatting.bold) classes += ' font-bold';
    if (formatting.italic) classes += ' italic';
    if (formatting.strikethrough) classes += ' line-through';
    if (formatting.alignment) {
      switch (formatting.alignment) {
        case 'left':
          classes += ' text-left';
          break;
        case 'center':
          classes += ' text-center';
          break;
        case 'right':
          classes += ' text-right';
          break;
      }
    }
  }

  return classes;
}

/**
 * Generate a unique ID for formatting
 */
function generateFormattingId(): string {
  return `fmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get metadata for a cell based on its position and section
 */
export function getMetadataForCell(
  column: string,
  section: string,
  isTotal: boolean = false
): CellMetadata {
  // Product column
  if (column === 'product') {
    return {
      type: 'product',
      section: 'Product',
      formatting: {
        id: generateFormattingId(),
        bold: isTotal,
        alignment: 'left',
      },
    };
  }

  // Values section
  if (section === 'Values') {
    return {
      type: 'currency',
      section: 'Values',
      formatting: {
        id: generateFormattingId(),
        bold: isTotal,
        alignment: 'left',
      },
    };
  }

  // YoY Growth section
  if (section === 'YoY Growth') {
    return {
      type: 'percentage',
      section: 'YoY Growth',
      formatting: {
        id: generateFormattingId(),
        bold: isTotal,
        alignment: 'left',
      },
    };
  }

  // Percent of Total section
  if (section === 'Percent of Total') {
    return {
      type: 'percentage',
      section: 'Percent of Total',
      formatting: {
        id: generateFormattingId(),
        bold: isTotal,
        alignment: 'left',
      },
    };
  }

  // Default metadata
  return {
    type: 'text',
    section: 'Values',
    formatting: {
      id: generateFormattingId(),
      alignment: 'left',
    },
  };
}

/**
 * Get growth indicator for percentage values
 */
export function getGrowthIndicator(value: string | number): 'positive' | 'negative' | 'neutral' {
  if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
    value = Number(value);
  }

  if (typeof value === 'number') {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
  }

  return 'neutral';
} 

/**
 * Converts a value to a string, returns empty string for null/undefined.
 */
export const safeStringify = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  return "";
}; 