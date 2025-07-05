import { doc, getDoc, updateDoc, setDoc, collection, getDocs, DocumentSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { createAPIResponse } from '../utils';
import type { CellFormatting } from '@/components/grid/types/common';
import type { APIResponse } from '@/types/api';

const CELLS_METADATA_COLLECTION = 'cellsMetadata';

/**
 * Fetches all cells metadata from Firestore
 * @returns Promise<APIResponse<CellFormatting[]>>
 */
export const getAllCellsMetadata = async (): Promise<APIResponse<CellFormatting[]>> => {
  try {
    const collectionRef = collection(db, CELLS_METADATA_COLLECTION);
    const querySnapshot = await getDocs(collectionRef);
    
    const cellsMetadata: CellFormatting[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<CellFormatting, 'id'>;
      cellsMetadata.push({
        id: doc.id,
        ...data
      });
    });

    return createAPIResponse(cellsMetadata, 200, 'Cells metadata fetched successfully');
  } catch (error) {
    console.error('Error fetching all cells metadata:', error);
    return createAPIResponse([], 500, error instanceof Error ? error.message : 'Failed to fetch cells metadata');
  }
};

/**
 * Updates a cell metadata by its ID in Firestore, or creates it if it doesn't exist
 * @param cellId - The ID of the cell to update or create
 * @param metadata - The cell metadata to update or create
 * @returns Promise<APIResponse<boolean>>
 */
export const updateCellMetadataById = async (
  cellId: string, 
  metadata: CellFormatting
): Promise<APIResponse<boolean>> => {
  try {
    const cellDocRef = doc(db, CELLS_METADATA_COLLECTION, cellId);
    
    // Check if the document exists
    const cellSnapshot: DocumentSnapshot = await getDoc(cellDocRef);
    
    // Extract data without id for Firestore operation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...metadataWithoutId } = metadata;
    
    if (cellSnapshot.exists()) {
      // Update existing document
      await updateDoc(cellDocRef, metadataWithoutId);
      return createAPIResponse(true, 200, 'Cell metadata updated successfully');
    } else {
      // Create new document
      await setDoc(cellDocRef, metadataWithoutId);
      return createAPIResponse(true, 200, 'Cell metadata created successfully');
    }
  } catch (error) {
    console.error('Error updating/creating cell metadata by ID:', error);
    return createAPIResponse(false, 500, error instanceof Error ? error.message : 'Failed to update/create cell metadata');
  }
};

/**
 * Updates multiple cell metadata documents at once using Firestore batch operations
 * @param cellUpdates - Map of cellId to metadata for bulk updates
 * @returns Promise<APIResponse<boolean>>
 */
export const updateMultipleCellsMetadata = async (
  cellUpdates: Map<string, CellFormatting>
): Promise<APIResponse<boolean>> => {
  try {
    const batch = writeBatch(db);
    
    // Add all updates to the batch
    for (const [cellId, metadata] of cellUpdates.entries()) {
      const cellDocRef = doc(db, CELLS_METADATA_COLLECTION, cellId);
      
      // Extract data without id for Firestore operation
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...metadataWithoutId } = metadata;
      
      // Use set with merge option to update or create document
      batch.set(cellDocRef, metadataWithoutId, { merge: true });
    }
    
    // Execute the batch
    await batch.commit();
    
    return createAPIResponse(true, 200, `Successfully updated ${cellUpdates.size} cell metadata documents`);
  } catch (error) {
    console.error('Error updating multiple cells metadata:', error);
    return createAPIResponse(false, 500, error instanceof Error ? error.message : 'Failed to update multiple cells metadata');
  }
};
