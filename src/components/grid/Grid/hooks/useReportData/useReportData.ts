import { useState, useEffect, useCallback } from 'react';
import { updateCellMetadataById, updateMultipleCellsMetadata } from '@/api/cellsMetadata/cellsMetadata';
import { createGenericAdapter, type AdapterOutput } from './utils';
import { generateCellKey } from '@/components/grid/utils/formatting';
import type { CellFormatting, CellPosition } from '@/components/grid/types/common';

/**
 * useSpreadsheetData - Custom hook for managing spreadsheet data
 * Handles data fetching, loading states, and API interactions
 */
export const useReportData = (reportId: string) => {
  const [data, setData] = useState<AdapterOutput>({
    rows: [],
    sections: [],
    columnOrder: [],
    columnMapping: new Map(),
    cellMetadata: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch spreadsheet data from API
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Transform using generic adapter
      const adapterOutput = await createGenericAdapter(reportId);

      console.log("Adapter output:", adapterOutput);

      setData(adapterOutput);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load spreadsheet data';
      setError(errorMessage);
      console.error('Error fetching spreadsheet data:', err);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  /**
   * Refresh data from API
   */
  const refreshData = () => {
    void fetchData();
  };

  /**
   * Update cell formatting and refresh data
   */
  const updateCellFormatting = async (
    row: number,
    column: number,
    formatting: Partial<CellFormatting>
  ) => {
    if (!data) return;

    const cellKey = generateCellKey(reportId, row, column);
    const currentMetadata = data.cellMetadata.get(cellKey);

    if (!currentMetadata?.formatting) {
      console.warn(`No formatting metadata found for cell at row ${row}, column ${column}`);
      return;
    }

    // Create updated formatting
    const updatedFormatting: CellFormatting = {
      ...currentMetadata.formatting,
      ...formatting,
    };

    // Update via Firebase API
    const response = await updateCellMetadataById(cellKey, updatedFormatting);
    
    if (response.status === 200) {
      // Update the local data structure
      const updatedMetadata = {
        ...currentMetadata,
        formatting: updatedFormatting,
      };
      const newData = { ...data };
      newData.cellMetadata.set(cellKey, updatedMetadata);
      setData(newData);
    } else {
      console.error('Failed to update cell formatting:', response.message);
    }
  };

  /**
   * Update multiple cells formatting with optimistic updates
   */
  const updateMultipleCellsFormatting = async (
    cellUpdates: Array<{
      position: CellPosition;
      formatting: Partial<CellFormatting>;
    }>
  ) => {
    if (!data || cellUpdates.length === 0) return;

    // Store original state for rollback
    const originalData = { ...data };
    const originalCellMetadata = new Map(data.cellMetadata);

    // Optimistically update local state first
    const newData = { ...data };
    const cellUpdatesMap = new Map<string, CellFormatting>();

    for (const { position, formatting } of cellUpdates) {
      const cellKey = generateCellKey(reportId, position.row, position.column);
      const currentMetadata = data.cellMetadata.get(cellKey);

      if (!currentMetadata?.formatting) {
        console.warn(`No formatting metadata found for cell at row ${position.row}, column ${position.column}`);
        continue;
      }

      // Create updated formatting
      const updatedFormatting: CellFormatting = {
        ...currentMetadata.formatting,
        ...formatting,
      };

      // Update local state optimistically
      const updatedMetadata = {
        ...currentMetadata,
        formatting: updatedFormatting,
      };
      newData.cellMetadata.set(cellKey, updatedMetadata);
      cellUpdatesMap.set(cellKey, updatedFormatting);
    }

    // Apply optimistic updates to UI
    setData(newData);

    try {
      // Perform batch API call
      const response = await updateMultipleCellsMetadata(cellUpdatesMap);
      
      if (response.status !== 200) {
        console.error('Failed to update multiple cells formatting:', response.message);
        // Rollback optimistic updates
        setData({
          ...originalData,
          cellMetadata: originalCellMetadata,
        });
      }
    } catch (error) {
      console.error('Error updating multiple cells formatting:', error);
      // Rollback optimistic updates
      setData({
        ...originalData,
        cellMetadata: originalCellMetadata,
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    setData,
    loading,
    error,
    refreshData,
    updateCellFormatting,
    updateMultipleCellsFormatting,
  };
}; 