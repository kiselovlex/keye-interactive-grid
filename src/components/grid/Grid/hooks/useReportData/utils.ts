import type { ReportData, CellMetadata, CellFormatting } from '@/components/grid/types/common';
import { getReportById } from '@/api/reports/reports';
import { getAllCellsMetadata } from '@/api/cellsMetadata/cellsMetadata';
import { getMetadataForCell } from '@/components/grid/utils/formatting';
import { generateCellKey } from '@/components/grid/utils/formatting';

/**
 * Generic flattened row format - works with any section names
 */
export interface FlattenedRow {
  [key: string]: string | number;
}

/**
 * Section metadata for column grouping
 */
export interface SectionMetadata {
  name: string;
  columns: ColumnMetadata[];
  type: 'product' | 'currency' | 'percentage' | 'growth' | 'other';
}

export interface ColumnMetadata {
  id: string;           // Prefixed for internal use: 'values_2020'
  name: string;         // Display name: '2020'
  originalKey: string;  // Original API key: '2020'
  originalSection: string; // Original section: 'Values'
  section: string;      // Display section: 'Values'
  type: 'product' | 'currency' | 'percentage' | 'growth' | 'other';
}

/**
 * Generic adapter output - now includes cell metadata
 */
export interface AdapterOutput {
  rows: FlattenedRow[];
  sections: SectionMetadata[];
  columnOrder: string[];
  columnMapping: Map<string, ColumnMetadata>;
  // Map of "row:column" to cell metadata
  cellMetadata: Map<string, CellMetadata>;
}

/**
 * Generic function to determine section type from section name
 */
const inferSectionType = (sectionName: string): 'product' | 'currency' | 'percentage' | 'growth' | 'other' => {
  const lowerName = sectionName.toLowerCase();
  
  if (lowerName.includes('growth') || lowerName.includes('yoy')) return 'growth';
  if (lowerName.includes('percent') || lowerName.includes('pct')) return 'percentage';
  if (lowerName.includes('value') || lowerName.includes('revenue') || lowerName.includes('amount')) return 'currency';
  if (lowerName.includes('product') || lowerName.includes('item')) return 'product';
  
  return 'other';
};

/**
 * Generic function to create column prefix from section name
 */
const createColumnPrefix = (sectionName: string): string => {
  return sectionName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .substring(0, 10); // Limit length
};

/**
 * Helper function to determine cell type based on column and value
 */
const determineCellType = (columnId: string, columnMeta: ColumnMetadata | null, value: string | number): CellMetadata['type'] => {
  if (columnMeta) {
    switch (columnMeta.type) {
      case 'product': return 'product';
      case 'currency': return 'currency';
      case 'percentage': return 'percentage';
      case 'growth': return 'percentage';
      default: return typeof value === 'number' ? 'number' : 'text';
    }
  }
  
  // Fallback determination
  if (columnId === 'product') return 'product';
  if (typeof value === 'number') return 'number';
  return 'text';
};

/**
 * Helper function to determine cell section
 */
const determineCellSection = (columnId: string, columnMeta: ColumnMetadata | null): CellMetadata['section'] => {
  if (columnMeta) {
    switch (columnMeta.section) {
      case 'Values': return 'Values';
      case 'YoY Growth': return 'YoY Growth';
      case 'Percent of Total': return 'Percent of Total';
      case 'Product': return 'Product';
      default: return 'Values';
    }
  }
  
  // Fallback determination
  if (columnId === 'product') return 'Product';
  return 'Values';
};

/**
 * Generic adapter that works with any multi-section data structure
 * Now fetches report and cell metadata from Firebase endpoints
 */
export const createGenericAdapter = async (reportId: string): Promise<AdapterOutput> => {
  // 1. Fetch report data by ID
  const reportResponse = await getReportById(reportId);
  if (reportResponse.status !== 200 || !reportResponse.data) {
    throw new Error(`Failed to fetch report: ${reportResponse.message}`);
  }
  const data: ReportData = reportResponse.data;
  
  // 2. Fetch all cells metadata
  const cellsMetadataResponse = await getAllCellsMetadata();
  if (cellsMetadataResponse.status !== 200) {
    throw new Error(`Failed to fetch cells metadata: ${cellsMetadataResponse.message}`);
  }
  const cellsFormatting: CellFormatting[] = cellsMetadataResponse.data;
  
  // Create a mapping from cell ID to formatting
  const cellFormattingMap = new Map<string, CellFormatting>();
  cellsFormatting.forEach(formatting => {
    cellFormattingMap.set(formatting.id, formatting);
  });
  
  // 3. Transform report data into table friendly format
  const sections: SectionMetadata[] = [];
  const columnOrder: string[] = [];
  const columnMapping = new Map<string, ColumnMetadata>();
  const cellMetadata = new Map<string, CellMetadata>();
  
  // Find the primary section (usually the first one or one with most data)
  const primarySectionKey = Object.keys(data)[0];
  const primarySection = data[primarySectionKey];
  
  // Define the desired section order
  const sectionOrder = ['Product', 'Values', 'YoY Growth', 'Percent of Total'];
  
  // Collect all sections first (excluding product columns)
  const tempSections: SectionMetadata[] = [];
  
  // Find and create product section first
  let productColumnMeta: ColumnMetadata | null = null;
  
  // Find the product column from the first section that has it
  Object.entries(data).forEach(([sectionName, sectionData]) => {
    if (!productColumnMeta) {
      const productCol = sectionData.columns.find(col => 
        col.key.toLowerCase().includes('product') || col.key === 'product'
      );
      if (productCol) {
        productColumnMeta = {
          id: 'product',
          name: productCol.name,
          originalKey: productCol.key,
          originalSection: sectionName,
          section: 'Product',
          type: 'product',
        };
        columnMapping.set('product', productColumnMeta);
      }
    }
  });
  
  // Add product section (special section without group header)
  if (productColumnMeta) {
    tempSections.push({
      name: 'Product',
      columns: [productColumnMeta],
      type: 'product',
    });
  }
  
  // Process each data section (excluding product columns)
  Object.entries(data).forEach(([sectionName, sectionData]) => {
    const sectionType = inferSectionType(sectionName);
    const prefix = createColumnPrefix(sectionName);
    
    const sectionMetadata: SectionMetadata = {
      name: sectionName,
      columns: [],
      type: sectionType,
    };
    
    // Process columns in this section (skip product columns)
    sectionData.columns.forEach(col => {
      const isProductColumn = col.key.toLowerCase().includes('product') || col.key === 'product';
      
      if (!isProductColumn) {
        const columnId = `${prefix}_${col.key}`;
        const columnMeta: ColumnMetadata = {
          id: columnId,
          name: col.name,
          originalKey: col.key,
          originalSection: sectionName,
          section: sectionName,
          type: sectionType,
        };
        sectionMetadata.columns.push(columnMeta);
        columnMapping.set(columnId, columnMeta);
      }
    });
    
    // Only add section if it has non-product columns
    if (sectionMetadata.columns.length > 0) {
      tempSections.push(sectionMetadata);
    }
  });
  
  // Sort sections according to the desired order
  tempSections.sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a.name);
    const bIndex = sectionOrder.indexOf(b.name);
    
    // If section is not in the predefined order, put it at the end
    const aOrder = aIndex === -1 ? sectionOrder.length : aIndex;
    const bOrder = bIndex === -1 ? sectionOrder.length : bIndex;
    
    return aOrder - bOrder;
  });
  
  // Add sorted sections to the final sections array
  sections.push(...tempSections);
  
  // Build columnOrder based on the sorted sections BEFORE processing cells
  tempSections.forEach(section => {
    section.columns.forEach(column => {
      columnOrder.push(column.id);
    });
  });
  
  // 4. Create flattened rows and process cell metadata
  const rows: FlattenedRow[] = [];
  
  for (let rowIndex = 0; rowIndex < primarySection.items.length; rowIndex++) {
    const row: FlattenedRow = {};
    
    // Add data from each section
    for (const [sectionName, sectionData] of Object.entries(data)) {
      const prefix = createColumnPrefix(sectionName);
      const item = sectionData.items[rowIndex];
      
      for (const col of sectionData.columns) {
        const isProductColumn = col.key.toLowerCase().includes('product') || col.key === 'product';
        
        if (isProductColumn) {
          row.product = item[col.key];
          
          // Process metadata for product column
          const cellKey = generateCellKey(reportId, rowIndex, 0);
          const columnMeta = columnMapping.get('product') ?? null;
          const cellType = determineCellType('product', columnMeta, item[col.key]);
          const cellSection = determineCellSection('product', columnMeta);
          
          // Check if there's existing formatting for this cell
          const existingFormatting = cellFormattingMap.get(cellKey);
          
          // Create cell metadata with generated type/section and fetched formatting
          const cellMetadataEntry: CellMetadata = {
            type: cellType,
            section: cellSection,
            formatting: existingFormatting || {
              id: cellKey,
              // Use default formatting from CellFormatter
              ...getMetadataForCell(
                'product',
                'Product',
                String(item[col.key]).toLowerCase() === 'total'
              ).formatting
            }
          };
          
          cellMetadata.set(cellKey, cellMetadataEntry);
        } else {
          const columnId = `${prefix}_${col.key}`;
          row[columnId] = item[col.key];
          
          // Process metadata for data columns
          const columnPosition = columnOrder.indexOf(columnId);
          if (columnPosition !== -1) {
            const cellKey = generateCellKey(reportId, rowIndex, columnPosition);
            const columnMeta = columnMapping.get(columnId) ?? null;
            const cellType = determineCellType(columnId, columnMeta, item[col.key]);
            const cellSection = determineCellSection(columnId, columnMeta);
          
            // Check if there's existing formatting for this cell
            const existingFormatting = cellFormattingMap.get(cellKey);
            
            // Create cell metadata with generated type/section and fetched formatting
            const cellMetadataEntry: CellMetadata = {
              type: cellType,
              section: cellSection,
              formatting: existingFormatting || {
                id: cellKey,
                // Use default formatting from CellFormatter
                ...getMetadataForCell(
                  columnId,
                  sectionName,
                  String(item[col.key]).toLowerCase() === 'total'
                ).formatting
              }
            };
            
            cellMetadata.set(cellKey, cellMetadataEntry);
          }
        }
      }
    }
    
    rows.push(row);
  }
  
  return {
    rows,
    sections,
    columnOrder,
    columnMapping,
    cellMetadata,
  };
}; 