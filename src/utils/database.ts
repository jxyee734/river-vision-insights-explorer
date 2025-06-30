export interface VideoAnalysisRecord {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  analysisDate: string;
  location: {
    state: string;
    river: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  results: {
    averageVelocity: number;
    flowMagnitude: number;
    trashCount: number;
    trashCategories: string[];
    environmentalImpact: string;
    averageDepth?: number;
    maxDepth?: number;
  };
  processingMetrics: {
    framesProcessed: number;
    processingTime: number;
    opticalFlowMethod: "lucas-kanade" | "farneback";
    analysisQuality: "high" | "medium" | "low";
  };
  weatherConditions?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  droneData?: {
    droneId: string;
    batteryLevel: number;
    deploymentDepth: number;
    missionId?: string;
  };
  status: "completed" | "processing" | "failed";
  notes?: string;
  tags: string[];
  syncStatus: "pending" | "synced" | "failed";
  lastSyncAttempt?: string;
}

export interface DatabaseStats {
  totalRecords: number;
  totalSize: number;
  successfulAnalyses: number;
  averageProcessingTime: number;
  mostCommonLocation: string;
  syncedRecords: number;
  pendingSync: number;
}

class VideoAnalysisDatabase {
  private readonly STORAGE_KEY = "river-analysis-database";
  private readonly SETTINGS_KEY = "river-analysis-db-settings";

  // Get all records
  getAllRecords(): VideoAnalysisRecord[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading database:", error);
      return [];
    }
  }

  // Save a new record
  saveRecord(
    record: Omit<VideoAnalysisRecord, "id" | "uploadDate">,
  ): VideoAnalysisRecord {
    const records = this.getAllRecords();
    const newRecord: VideoAnalysisRecord = {
      ...record,
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadDate: new Date().toISOString(),
    };

    records.push(newRecord);
    this.saveAllRecords(records);
    return newRecord;
  }

  // Update an existing record
  updateRecord(
    id: string,
    updates: Partial<VideoAnalysisRecord>,
  ): VideoAnalysisRecord | null {
    const records = this.getAllRecords();
    const index = records.findIndex((record) => record.id === id);

    if (index === -1) return null;

    records[index] = { ...records[index], ...updates };
    this.saveAllRecords(records);
    return records[index];
  }

  // Delete a record
  deleteRecord(id: string): boolean {
    const records = this.getAllRecords();
    const filteredRecords = records.filter((record) => record.id !== id);

    if (filteredRecords.length === records.length) return false;

    this.saveAllRecords(filteredRecords);
    return true;
  }

  // Get records by criteria
  getRecordsByCriteria(criteria: {
    location?: string;
    dateRange?: { start: string; end: string };
    status?: string;
    tags?: string[];
    syncStatus?: string;
  }): VideoAnalysisRecord[] {
    const records = this.getAllRecords();

    return records.filter((record) => {
      if (
        criteria.location &&
        !record.location.state
          .toLowerCase()
          .includes(criteria.location.toLowerCase()) &&
        !record.location.river
          .toLowerCase()
          .includes(criteria.location.toLowerCase())
      ) {
        return false;
      }

      if (criteria.dateRange) {
        const recordDate = new Date(record.analysisDate);
        const startDate = new Date(criteria.dateRange.start);
        const endDate = new Date(criteria.dateRange.end);
        if (recordDate < startDate || recordDate > endDate) {
          return false;
        }
      }

      if (criteria.status && record.status !== criteria.status) {
        return false;
      }

      if (criteria.syncStatus && record.syncStatus !== criteria.syncStatus) {
        return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some((tag) =>
          record.tags.some((recordTag) =>
            recordTag.toLowerCase().includes(tag.toLowerCase()),
          ),
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }

  // Get database statistics
  getStats(): DatabaseStats {
    const records = this.getAllRecords();

    const totalSize = records.reduce((sum, record) => sum + record.fileSize, 0);
    const successfulAnalyses = records.filter(
      (r) => r.status === "completed",
    ).length;
    const avgProcessingTime =
      records.length > 0
        ? records.reduce(
            (sum, r) => sum + r.processingMetrics.processingTime,
            0,
          ) / records.length
        : 0;

    // Find most common location
    const locationCounts: { [key: string]: number } = {};
    records.forEach((record) => {
      const location = `${record.location.state} - ${record.location.river}`;
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const mostCommonLocation = Object.keys(locationCounts).reduce(
      (a, b) => (locationCounts[a] > locationCounts[b] ? a : b),
      "N/A",
    );

    const syncedRecords = records.filter(
      (r) => r.syncStatus === "synced",
    ).length;
    const pendingSync = records.filter(
      (r) => r.syncStatus === "pending",
    ).length;

    return {
      totalRecords: records.length,
      totalSize,
      successfulAnalyses,
      averageProcessingTime: avgProcessingTime,
      mostCommonLocation,
      syncedRecords,
      pendingSync,
    };
  }

  // Export data for backup
  exportData(): string {
    const records = this.getAllRecords();
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      records,
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): {
    success: boolean;
    imported: number;
    errors: string[];
  } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      if (!data.records || !Array.isArray(data.records)) {
        return { success: false, imported: 0, errors: ["Invalid data format"] };
      }

      const existingRecords = this.getAllRecords();
      const existingIds = new Set(existingRecords.map((r) => r.id));

      data.records.forEach((record: any, index: number) => {
        try {
          if (!record.id || existingIds.has(record.id)) {
            record.id = `imported_${Date.now()}_${index}`;
          }

          // Validate required fields
          if (!record.fileName || !record.analysisDate || !record.location) {
            errors.push(`Record ${index}: Missing required fields`);
            return;
          }

          existingRecords.push(record);
          imported++;
        } catch (error) {
          errors.push(`Record ${index}: ${error}`);
        }
      });

      this.saveAllRecords(existingRecords);
      return { success: true, imported, errors };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // Clear all data
  clearDatabase(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing database:", error);
      return false;
    }
  }

  // Private method to save all records
  private saveAllRecords(records: VideoAnalysisRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error("Error saving database:", error);
      throw new Error("Failed to save data to local storage");
    }
  }

  // Mark records for sync
  markForSync(ids: string[]): void {
    const records = this.getAllRecords();
    const updated = records.map((record) =>
      ids.includes(record.id)
        ? { ...record, syncStatus: "pending" as const }
        : record,
    );
    this.saveAllRecords(updated);
  }

  // Update sync status
  updateSyncStatus(
    id: string,
    status: "synced" | "failed",
    lastAttempt?: string,
  ): void {
    this.updateRecord(id, {
      syncStatus: status,
      lastSyncAttempt: lastAttempt || new Date().toISOString(),
    });
  }
}

// Singleton instance
export const database = new VideoAnalysisDatabase();

// Helper functions for common operations
export const dbHelpers = {
  // Convert analysis result to database record
  createRecordFromAnalysis: (
    analysisResult: any,
    file: File,
    location: { state: string; river: string },
    additionalData?: Partial<VideoAnalysisRecord>,
  ): Omit<VideoAnalysisRecord, "id" | "uploadDate"> => {
    return {
      fileName: file.name,
      fileSize: file.size,
      analysisDate: new Date().toISOString(),
      location: {
        state: location.state,
        river: location.river,
      },
      results: {
        averageVelocity: analysisResult.averageVelocity || 0,
        flowMagnitude: analysisResult.flowMagnitude || 0,
        trashCount: analysisResult.trashCount || 0,
        trashCategories: analysisResult.trashCategories || [],
        environmentalImpact: analysisResult.environmentalImpact || "",
        averageDepth: analysisResult.averageDepth,
        maxDepth: analysisResult.maxDepth,
      },
      processingMetrics: {
        framesProcessed: analysisResult.frames?.length || 0,
        processingTime: 0, // Will be calculated during processing
        opticalFlowMethod: "lucas-kanade", // Default, will be updated
        analysisQuality: "medium",
      },
      status: "completed",
      notes: "",
      tags: ["auto-generated"],
      syncStatus: "pending",
      ...additionalData,
    };
  },

  // Get recent records
  getRecentRecords: (limit: number = 10): VideoAnalysisRecord[] => {
    const records = database.getAllRecords();
    return records
      .sort(
        (a, b) =>
          new Date(b.analysisDate).getTime() -
          new Date(a.analysisDate).getTime(),
      )
      .slice(0, limit);
  },

  // Search records
  searchRecords: (query: string): VideoAnalysisRecord[] => {
    const records = database.getAllRecords();
    const lowercaseQuery = query.toLowerCase();

    return records.filter(
      (record) =>
        record.fileName.toLowerCase().includes(lowercaseQuery) ||
        record.location.state.toLowerCase().includes(lowercaseQuery) ||
        record.location.river.toLowerCase().includes(lowercaseQuery) ||
        record.notes?.toLowerCase().includes(lowercaseQuery) ||
        record.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
    );
  },
};
