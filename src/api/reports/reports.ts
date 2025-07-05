import { doc, getDoc, updateDoc, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { createAPIResponse } from '../utils';
import type { ReportData } from '@/components/grid/types/common';
import type { APIResponse } from '@/types/api';

const REPORTS_COLLECTION = 'reports';

/**
 * Fetches a report by its ID from Firestore
 * @param reportId - The ID of the report to fetch
 * @returns Promise<APIResponse<SpreadsheetData | null>>
 */
export const getReportById = async (reportId: string): Promise<APIResponse<ReportData | null>> => {
  try {
    const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
    const reportSnapshot: DocumentSnapshot = await getDoc(reportDocRef);
    
    if (!reportSnapshot.exists()) {
      return createAPIResponse(null, 404, `Report with ID ${reportId} not found`);
    }

    const reportData = reportSnapshot.data() as ReportData;
    
    return createAPIResponse(reportData, 200, 'Report fetched successfully');
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    return createAPIResponse(null, 500, error instanceof Error ? error.message : 'Failed to fetch report');
  }
};

/**
 * Updates a report by its ID in Firestore
 * @param reportId - The ID of the report to update
 * @param reportData - The updated report data
 * @returns Promise<APIResponse<boolean>>
 */
export const updateReportById = async (
  reportId: string, 
  reportData: ReportData
): Promise<APIResponse<boolean>> => {
  try {
    const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
    
    // Check if the document exists before updating
    const reportSnapshot: DocumentSnapshot = await getDoc(reportDocRef);
    
    if (!reportSnapshot.exists()) {
      return createAPIResponse(false, 404, `Report with ID ${reportId} not found`);
    }

    // Update the document with the new data
    await updateDoc(reportDocRef, reportData);
    
    return createAPIResponse(true, 200, 'Report updated successfully');
  } catch (error) {
    console.error('Error updating report by ID:', error);
    return createAPIResponse(false, 500, error instanceof Error ? error.message : 'Failed to update report');
  }
};
