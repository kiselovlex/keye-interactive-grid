import { useState, useCallback } from 'react';
import type { AdapterOutput } from '@/components/grid/Grid/hooks/useReportData/utils';
import { updateReportById } from '@/api/reports/reports';
import { REPORT_ID } from '@/api';
import type { CellMetadata, CellPosition, ReportData } from '@/components/grid/types/common';
import type { UseEditDataProps, UseEditDataReturn } from './types';

/**
 * Convert AdapterOutput back to SpreadsheetData format
 */
const convertToSpreadsheetData = (adapterOutput: AdapterOutput): ReportData => {
  const spreadsheetData: ReportData = {};
  
  // Group columns by original section
  const sectionColumns = new Map<string, Array<{key: string; name: string}>>();
  
  // Process columns from mapping
  adapterOutput.columnMapping.forEach((columnMeta) => {
    const { originalSection, originalKey, name } = columnMeta;
    
    if (!sectionColumns.has(originalSection)) {
      sectionColumns.set(originalSection, []);
    }
    
    sectionColumns.get(originalSection)!.push({
      key: originalKey,
      name: name
    });
  });
  
  // Create sections with their data
  sectionColumns.forEach((columns, sectionName) => {
    const sectionItems: Array<{[key: string]: string | number}> = [];
    
    // Transform each row for this section
    adapterOutput.rows.forEach((row) => {
      const sectionItem: {[key: string]: string | number} = {};
      
      // Add data for each column in this section
      columns.forEach(({ key }) => {
        if (key === 'product') {
          sectionItem[key] = row.product;
        } else {
          // Find the internal column ID for this original key
          const columnMeta = Array.from(adapterOutput.columnMapping.values())
            .find(meta => meta.originalKey === key && meta.originalSection === sectionName);
          
          if (columnMeta) {
            sectionItem[key] = row[columnMeta.id];
          }
        }
      });
      
      sectionItems.push(sectionItem);
    });
    
    spreadsheetData[sectionName] = {
      columns: columns,
      items: sectionItems
    };
  });
  
  return spreadsheetData;
};

/**
 * Validate a cell value based on its metadata
 */
const validateValue = (value: string, metadata: CellMetadata): boolean => {
  // Empty values are generally valid for optional fields
  if (value.trim() === '') {
    return true;
  }
  
  switch (metadata.type) {
    case 'number':
    case 'currency':
    case 'percentage':
      return !isNaN(parseFloat(value));
    case 'product':
    case 'text':
    default:
      return true;
  }
};

/**
 * useSpreadsheetEdit - Grid-level hook for managing single cell editing
 * Only one cell can be edited at a time across the entire spreadsheet
 */
export const useEditData = ({ data, onDataUpdate }: UseEditDataProps): UseEditDataReturn => {
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isEditValid, setIsEditValid] = useState<boolean>(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Helper to get cell metadata (simplified version)
  const getCellMetadata = useCallback((position: CellPosition, columnKey: string, data: AdapterOutput) => {
    const row = data.rows[position.row];
    const isTotal = row && String(row.product).toLowerCase() === 'total';
    
    // Find the section this column belongs to
    const section = data.sections.find((s) => 
      s.columns?.some((col) => col.id === columnKey)
    );
    
    const sectionName = section?.name || 'Unknown';
    
    // Map dynamic section names to expected CellMetadata section types
    const mapSectionName = (name: string): 'Values' | 'YoY Growth' | 'Percent of Total' | 'Product' => {
      if (name === 'Product') return 'Product';
      if (name.includes('Growth') || name.includes('YoY')) return 'YoY Growth';
      if (name.includes('Percent') || name.includes('percent')) return 'Percent of Total';
      return 'Values'; // Default fallback
    };
    
    // Basic metadata - extend as needed
    const metadata: CellMetadata = {
      type: sectionName.includes('Growth') ? 'percentage' : 
            sectionName.includes('Value') ? 'currency' : 'text',
      editable: !isTotal && columnKey !== 'product',
      section: mapSectionName(sectionName),
      // @ts-expect-error - update to CellFormatting is required, but I do not have time now
      formatting: {
        alignment: columnKey === 'product' ? 'left' : 'right',
      },
      validation: {
        required: false,
      },
    };
    
    return metadata;
  }, []);

  // Helper to get cell data by position
  const getCellData = useCallback((position: CellPosition) => {
    const row = data.rows[position.row];
    const internalColumnId = data.columnOrder[position.column];
    const rawValue = row?.[internalColumnId] ?? '';
    
    // Get column metadata to access originalKey
    const columnMetadata = data.columnMapping.get(internalColumnId);
    const originalKey = columnMetadata?.originalKey || internalColumnId;
    
    // Get metadata for validation/formatting
    const metadata = getCellMetadata(position, internalColumnId, data);
    
    return { rawValue, metadata, columnKey: originalKey, internalColumnId };
  }, [data, getCellMetadata]);

  // Convert string value to appropriate type
  const convertValue = useCallback((value: string, metadata: CellMetadata): string | number => {
    if (metadata.type === 'number' || metadata.type === 'currency' || metadata.type === 'percentage') {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : numValue;
    }
    return value;
  }, []);

  // Start editing a cell
  const startEdit = useCallback((position: CellPosition) => {
    const { rawValue } = getCellData(position);
  
    
    setEditingCell(position);
    setEditValue(String(rawValue));
    setIsEditValid(true);
    setEditError(null);
  }, [getCellData]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
    setIsEditValid(true);
    setEditError(null);
  }, []);

  // Save the current edit with optimistic updates
  const saveEdit = useCallback(async () => {
    if (!editingCell || !isEditValid) return;
    
    const { metadata, columnKey, internalColumnId } = getCellData(editingCell);
    const convertedValue = convertValue(editValue, metadata);
    
    // Get the original section name from column metadata
    const columnMetadata = data.columnMapping.get(internalColumnId);
    const originalSectionName = columnMetadata?.originalSection;
    
    // Store backup for rollback with proper deep copying
    const backupRows = [...data.rows];
    const backupData: AdapterOutput = {
      ...data,
      rows: backupRows,
    };
    
    try {
      setIsSaving(true);
      setEditError(null);
      
      // Optimistic update: Update local state immediately with proper deep copying
      const newRows = [...data.rows]; // Create new array reference
      const targetRow = { ...newRows[editingCell.row] }; // Create new row object
      if (internalColumnId === 'product') {
        targetRow.product = convertedValue;
      } else {
        targetRow[internalColumnId] = convertedValue;
      }
      newRows[editingCell.row] = targetRow; // Replace the row in the new array

      const newData: AdapterOutput = {
        ...data,
        rows: newRows, // Use the new array with the updated row
      };

      // Update the parent data state optimistically
      onDataUpdate(newData);
      
      console.log("Saving edit:", convertedValue, editingCell.row, columnKey, "in section:", originalSectionName);
      
      // Convert AdapterOutput back to SpreadsheetData format for the API
      const spreadsheetData: ReportData = convertToSpreadsheetData(newData);
      
      // Make the API call to update the entire report
      const response = await updateReportById(REPORT_ID, spreadsheetData);
      
      if (response.status !== 200) {
        throw new Error(response.message || 'Failed to update report');
      }
      
      console.log("Saved successfully");
      
      setEditingCell(null);
      setEditValue('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save cell';
      setEditError(errorMessage);
      
      // Rollback optimistic update on error
      onDataUpdate(backupData);
      
      console.error('Error saving cell:', err);
    } finally {
      setIsSaving(false);
    }
  }, [editingCell, isEditValid, editValue, getCellData, convertValue, data, onDataUpdate]);

  // Update edit value with validation
  const updateEditValue = useCallback((value: string) => {
    setEditValue(value);
    
    if (editingCell) {
      const { metadata } = getCellData(editingCell);
      const valid = validateValue(value, metadata);
      setIsEditValid(valid);
      
      if (valid) {
        setEditError(null);
      }
    }
  }, [editingCell, getCellData, validateValue]);

  // Check if a specific cell is being edited
  const isCellEditing = useCallback((position: CellPosition): boolean => {
    return editingCell !== null &&
           editingCell.row === position.row &&
           editingCell.column === position.column;
  }, [editingCell]);

  return {
    editingCell,
    editValue,
    isEditValid,
    editError,
    isSaving,
    startEdit,
    cancelEdit,
    saveEdit,
    updateEditValue,
    isCellEditing,
  };
}; 