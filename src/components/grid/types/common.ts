/**
 * Common TypeScript interfaces for the spreadsheet component
 * Following the assessment data structure requirements with Values, YoY Growth, and Percent of Total
 */

export interface ReportColumn {
  name: string;
  key: string;
}

export interface ReportItem {
  [key: string]: string | number;
}

export interface ReportSection {
  columns: ReportColumn[];
  items: ReportItem[];
}

export interface ReportData {
  [sectionKey: string]: ReportSection;
}

export interface CellPosition {
  row: number;
  column: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SelectedCells {
  type: 'single' | 'range' | 'multiple';
  single?: CellPosition;
  range?: CellRange;
  multiple?: CellPosition[];
}

export interface SelectionState {
  selectedCells: SelectedCells | null;
  isSelecting: boolean;
  selectionStart: CellPosition | null;
  // Track which cell is "active" for editing/navigation within a range
  // When range is selected, this is the cell that would be edited on Enter/F2
  // and the starting point for Tab navigation within the range
  activeCell: CellPosition | null;
}

export interface CellFormatting {
  id: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
}

export interface CellMetadata {
  type: 'text' | 'number' | 'currency' | 'percentage' | 'product';
  section: 'Values' | 'YoY Growth' | 'Percent of Total' | 'Product';
  formatting?: CellFormatting;
}

export interface CellData {
  rawValue: string | number;
  metadata: CellMetadata;
  position: CellPosition;
}

export interface EditingCell {
  position: CellPosition;
  originalValue: string | number;
  currentValue: string;
  isValid: boolean;
}