import { describe, it, expect, vi } from 'vitest';
import {
  generateCellKey,
  getSelectedCells,
  applyFormattingToSelection,
  applyAlignmentToSelection,
  formatValue,
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatProduct,
  formatText,
  getCellClasses,
  getMetadataForCell,
  getGrowthIndicator,
  safeStringify,
} from './formatting';
import type { CellMetadata } from '../types/common';
import type { UseSelectionReturn } from '../Grid/hooks/useSelection/types';

// Mock the REPORT_ID import
vi.mock('@/api', () => ({
  REPORT_ID: 'test-report-id',
}));

describe('generateCellKey', () => {
  it('should generate a cell key with correct format', () => {
    const result = generateCellKey('report-123', 5, 10);
    expect(result).toBe('report-123:5:10');
  });

  it('should handle zero values', () => {
    const result = generateCellKey('report-456', 0, 0);
    expect(result).toBe('report-456:0:0');
  });
});

describe('getSelectedCells', () => {
  it('should return empty array when no selection state', () => {
    const mockSelection = {
      selectionState: null,
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([]);
  });

  it('should return empty array when no selected cells', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: null,
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([]);
  });

  it('should return single cell when selection type is single', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: { row: 1, column: 2 },
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([{ row: 1, column: 2 }]);
  });

  it('should return empty array when single selection is null', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: null,
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([]);
  });

  it('should return range cells when selection type is range', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'range',
          range: {
            start: { row: 1, column: 1 },
            end: { row: 2, column: 2 },
          },
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([
      { row: 1, column: 1 },
      { row: 1, column: 2 },
      { row: 2, column: 1 },
      { row: 2, column: 2 },
    ]);
  });

  it('should handle inverted range correctly', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'range',
          range: {
            start: { row: 3, column: 3 },
            end: { row: 1, column: 1 },
          },
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([
      { row: 1, column: 1 },
      { row: 1, column: 2 },
      { row: 1, column: 3 },
      { row: 2, column: 1 },
      { row: 2, column: 2 },
      { row: 2, column: 3 },
      { row: 3, column: 1 },
      { row: 3, column: 2 },
      { row: 3, column: 3 },
    ]);
  });

  it('should return empty array when range is null', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'range',
          range: null,
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([]);
  });

  it('should return multiple cells when selection type is multiple', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'multiple',
          multiple: [
            { row: 1, column: 1 },
            { row: 2, column: 3 },
            { row: 5, column: 2 },
          ],
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([
      { row: 1, column: 1 },
      { row: 2, column: 3 },
      { row: 5, column: 2 },
    ]);
  });

  it('should return empty array when multiple selection is null', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'multiple',
          multiple: null,
        },
      },
    } as unknown as UseSelectionReturn;

    const result = getSelectedCells(mockSelection);
    expect(result).toEqual([]);
  });
});

describe('applyFormattingToSelection', () => {
  it('should use batch update when available', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: { row: 1, column: 2 },
        },
      },
    } as unknown as UseSelectionReturn;

    const mockUpdateCellFormatting = vi.fn();
    const mockUpdateMultipleCellsFormatting = vi.fn();
    const mockCellMetadata = new Map<string, CellMetadata>();

    applyFormattingToSelection(
      mockSelection,
      'bold',
      mockUpdateCellFormatting,
      mockCellMetadata,
      mockUpdateMultipleCellsFormatting
    );

    expect(mockUpdateMultipleCellsFormatting).toHaveBeenCalledWith([
      {
        position: { row: 1, column: 2 },
        formatting: { bold: true },
      },
    ]);
    expect(mockUpdateCellFormatting).not.toHaveBeenCalled();
  });

  it('should toggle formatting based on current state', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: { row: 1, column: 2 },
        },
      },
    } as unknown as UseSelectionReturn;

    const mockUpdateCellFormatting = vi.fn();
    const mockUpdateMultipleCellsFormatting = vi.fn();
    const mockCellMetadata = new Map<string, CellMetadata>();
    
    // Add existing metadata with bold=true
    mockCellMetadata.set('test-report-id:1:2', {
      type: 'text',
      section: 'Values',
      formatting: { id: 'test-id', bold: true },
    });

    applyFormattingToSelection(
      mockSelection,
      'bold',
      mockUpdateCellFormatting,
      mockCellMetadata,
      mockUpdateMultipleCellsFormatting
    );

    expect(mockUpdateMultipleCellsFormatting).toHaveBeenCalledWith([
      {
        position: { row: 1, column: 2 },
        formatting: { bold: false },
      },
    ]);
  });

  it('should fall back to individual updates when batch update is not available', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: { row: 1, column: 2 },
        },
      },
    } as unknown as UseSelectionReturn;

    const mockUpdateCellFormatting = vi.fn();
    const mockCellMetadata = new Map<string, CellMetadata>();

    applyFormattingToSelection(
      mockSelection,
      'italic',
      mockUpdateCellFormatting,
      mockCellMetadata
    );

    expect(mockUpdateCellFormatting).toHaveBeenCalledWith(1, 2, { italic: true });
  });
});

describe('applyAlignmentToSelection', () => {
  it('should use batch update when available', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: { row: 1, column: 2 },
        },
      },
    } as unknown as UseSelectionReturn;

    const mockUpdateCellFormatting = vi.fn();
    const mockUpdateMultipleCellsFormatting = vi.fn();

    applyAlignmentToSelection(
      mockSelection,
      'center',
      mockUpdateCellFormatting,
      mockUpdateMultipleCellsFormatting
    );

    expect(mockUpdateMultipleCellsFormatting).toHaveBeenCalledWith([
      {
        position: { row: 1, column: 2 },
        formatting: { alignment: 'center' },
      },
    ]);
    expect(mockUpdateCellFormatting).not.toHaveBeenCalled();
  });

  it('should fall back to individual updates when batch update is not available', () => {
    const mockSelection = {
      selectionState: {
        selectedCells: {
          type: 'single',
          single: { row: 1, column: 2 },
        },
      },
    } as unknown as UseSelectionReturn;

    const mockUpdateCellFormatting = vi.fn();

    applyAlignmentToSelection(
      mockSelection,
      'right',
      mockUpdateCellFormatting
    );

    expect(mockUpdateCellFormatting).toHaveBeenCalledWith(1, 2, { alignment: 'right' });
  });
});

describe('formatValue', () => {
  it('should format currency values', () => {
    const metadata: CellMetadata = { type: 'currency', section: 'Values' };
    const result = formatValue(1000, metadata);
    expect(result).toBe('$1,000');
  });

  it('should format percentage values', () => {
    const metadata: CellMetadata = { type: 'percentage', section: 'YoY Growth' };
    const result = formatValue(25.5, metadata);
    expect(result).toBe('25.5%');
  });

  it('should format number values', () => {
    const metadata: CellMetadata = { type: 'number', section: 'Values' };
    const result = formatValue(1234.56, metadata);
    expect(result).toBe('1,234.56');
  });

  it('should format product values', () => {
    const metadata: CellMetadata = { type: 'product', section: 'Product' };
    const result = formatValue('Product Name', metadata);
    expect(result).toBe('Product Name');
  });

  it('should format text values by default', () => {
    const metadata: CellMetadata = { type: 'text', section: 'Values' };
    const result = formatValue('Some text', metadata);
    expect(result).toBe('Some text');
  });
});

describe('formatCurrency', () => {
  it('should format positive numbers with dollar sign and commas', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(500000)).toBe('$500,000');
  });

  it('should format zero as $0', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should format negative numbers', () => {
    expect(formatCurrency(-1000)).toBe('$-1,000');
  });

  it('should format large numbers in millions', () => {
    expect(formatCurrency(1000000)).toBe('$1.0M');
    expect(formatCurrency(1234567)).toBe('$1.2M');
    expect(formatCurrency(2500000)).toBe('$2.5M');
  });

  it('should handle string numbers', () => {
    expect(formatCurrency('1000')).toBe('$1,000');
    expect(formatCurrency('0')).toBe('$0');
  });

  it('should handle invalid string inputs', () => {
    expect(formatCurrency('invalid')).toBe('invalid');
    expect(formatCurrency('')).toBe('');
  });
});

describe('formatPercentage', () => {
  it('should format numbers with percentage sign', () => {
    expect(formatPercentage(25.5)).toBe('25.5%');
    expect(formatPercentage(100)).toBe('100.0%');
  });

  it('should format zero as 0%', () => {
    expect(formatPercentage(0)).toBe('0%');
  });

  it('should format negative percentages', () => {
    expect(formatPercentage(-15.3)).toBe('-15.3%');
  });

  it('should handle string numbers', () => {
    expect(formatPercentage('25.5')).toBe('25.5%');
    expect(formatPercentage('0')).toBe('0%');
  });

  it('should handle invalid string inputs', () => {
    expect(formatPercentage('invalid')).toBe('invalid');
    expect(formatPercentage('')).toBe('');
  });
});

describe('formatNumber', () => {
  it('should format numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567.89)).toBe('1,234,567.89');
  });

  it('should format zero as 0', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should format negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
  });

  it('should limit decimal places to 2', () => {
    expect(formatNumber(123.456789)).toBe('123.46');
  });

  it('should handle string numbers', () => {
    expect(formatNumber('1000')).toBe('1,000');
    expect(formatNumber('123.45')).toBe('123.45');
  });

  it('should handle invalid string inputs', () => {
    expect(formatNumber('invalid')).toBe('invalid');
    expect(formatNumber('')).toBe('');
  });
});

describe('formatProduct', () => {
  it('should convert any input to string', () => {
    expect(formatProduct('Product Name')).toBe('Product Name');
    expect(formatProduct(123)).toBe('123');
  });
});

describe('formatText', () => {
  it('should convert any input to string', () => {
    expect(formatText('Some text')).toBe('Some text');
    expect(formatText(123)).toBe('123');
  });
});

describe('getCellClasses', () => {
  it('should return base classes for text type', () => {
    const metadata: CellMetadata = {
      type: 'text',
      section: 'Values',
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('cursor-pointer select-none transition-colors text-left');
  });

  it('should return right-aligned classes for currency type', () => {
    const metadata: CellMetadata = {
      type: 'currency',
      section: 'Values',
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('text-right font-mono');
  });

  it('should return right-aligned classes for percentage type', () => {
    const metadata: CellMetadata = {
      type: 'percentage',
      section: 'YoY Growth',
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('text-right font-mono');
  });

  it('should return right-aligned classes for number type', () => {
    const metadata: CellMetadata = {
      type: 'number',
      section: 'Values',
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('text-right font-mono');
  });

  it('should return left-aligned classes for product type', () => {
    const metadata: CellMetadata = {
      type: 'product',
      section: 'Product',
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('text-left font-medium');
  });

  it('should include YoY Growth color classes', () => {
    const metadata: CellMetadata = {
      type: 'percentage',
      section: 'YoY Growth',
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('data-[growth="positive"]:text-green-600 data-[growth="negative"]:text-red-600');
  });

  it('should include formatting classes when provided', () => {
    const metadata: CellMetadata = {
      type: 'text',
      section: 'Values',
      formatting: {
        id: 'test-id',
        bold: true,
        italic: true,
        strikethrough: true,
        alignment: 'center',
      },
    };
    const result = getCellClasses(metadata);
    expect(result).toContain('font-bold italic line-through text-center');
  });

  it('should handle different alignment options', () => {
    const leftAligned: CellMetadata = {
      type: 'text',
      section: 'Values',
      formatting: { id: 'test-id-left', alignment: 'left' },
    };
    expect(getCellClasses(leftAligned)).toContain('text-left');

    const rightAligned: CellMetadata = {
      type: 'text',
      section: 'Values',
      formatting: { id: 'test-id-right', alignment: 'right' },
    };
    expect(getCellClasses(rightAligned)).toContain('text-right');

    const centerAligned: CellMetadata = {
      type: 'text',
      section: 'Values',
      formatting: { id: 'test-id-center', alignment: 'center' },
    };
    expect(getCellClasses(centerAligned)).toContain('text-center');
  });
});

describe('getMetadataForCell', () => {
  it('should return product metadata for product column', () => {
    const result = getMetadataForCell('product', 'Values');
    expect(result.type).toBe('product');
    expect(result.section).toBe('Product');
    expect(result.formatting?.alignment).toBe('left');
  });

  it('should return currency metadata for Values section', () => {
    const result = getMetadataForCell('revenue', 'Values');
    expect(result.type).toBe('currency');
    expect(result.section).toBe('Values');
    expect(result.formatting?.alignment).toBe('left');
  });

  it('should return percentage metadata for YoY Growth section', () => {
    const result = getMetadataForCell('growth', 'YoY Growth');
    expect(result.type).toBe('percentage');
    expect(result.section).toBe('YoY Growth');
    expect(result.formatting?.alignment).toBe('left');
  });

  it('should return percentage metadata for Percent of Total section', () => {
    const result = getMetadataForCell('percent', 'Percent of Total');
    expect(result.type).toBe('percentage');
    expect(result.section).toBe('Percent of Total');
    expect(result.formatting?.alignment).toBe('left');
  });

  it('should return text metadata for unknown sections', () => {
    const result = getMetadataForCell('unknown', 'Unknown Section');
    expect(result.type).toBe('text');
    expect(result.section).toBe('Values');
    expect(result.formatting?.alignment).toBe('left');
  });

  it('should set bold formatting for totals', () => {
    const result = getMetadataForCell('revenue', 'Values', true);
    expect(result.formatting?.bold).toBe(true);
  });

  it('should generate unique formatting IDs', () => {
    const result1 = getMetadataForCell('revenue', 'Values');
    const result2 = getMetadataForCell('revenue', 'Values');
    expect(result1.formatting?.id).toBeDefined();
    expect(result2.formatting?.id).toBeDefined();
    expect(result1.formatting?.id).not.toBe(result2.formatting?.id);
  });
});

describe('getGrowthIndicator', () => {
  it('should return positive for positive numbers', () => {
    expect(getGrowthIndicator(5)).toBe('positive');
    expect(getGrowthIndicator(0.1)).toBe('positive');
  });

  it('should return negative for negative numbers', () => {
    expect(getGrowthIndicator(-5)).toBe('negative');
    expect(getGrowthIndicator(-0.1)).toBe('negative');
  });

  it('should return neutral for zero', () => {
    expect(getGrowthIndicator(0)).toBe('neutral');
  });

  it('should handle string numbers', () => {
    expect(getGrowthIndicator('5')).toBe('positive');
    expect(getGrowthIndicator('-5')).toBe('negative');
    expect(getGrowthIndicator('0')).toBe('neutral');
  });

  it('should return neutral for invalid strings', () => {
    expect(getGrowthIndicator('invalid')).toBe('neutral');
    expect(getGrowthIndicator('')).toBe('neutral');
  });

  it('should return neutral for non-numeric types', () => {
    expect(getGrowthIndicator('text')).toBe('neutral');
  });
});

describe('safeStringify', () => {
  it('should return empty string for null and undefined', () => {
    expect(safeStringify(null)).toBe('');
    expect(safeStringify(undefined)).toBe('');
  });

  it('should return string as-is', () => {
    expect(safeStringify('hello')).toBe('hello');
    expect(safeStringify('')).toBe('');
  });

  it('should convert numbers to strings', () => {
    expect(safeStringify(123)).toBe('123');
    expect(safeStringify(0)).toBe('0');
    expect(safeStringify(-456)).toBe('-456');
    expect(safeStringify(3.14159)).toBe('3.14159');
  });

  it('should convert booleans to strings', () => {
    expect(safeStringify(true)).toBe('true');
    expect(safeStringify(false)).toBe('false');
  });

  it('should convert other types to strings', () => {
    expect(safeStringify({})).toBe('');
    expect(safeStringify([])).toBe('');
    expect(safeStringify(() => {})).toBe('');
  });
}); 