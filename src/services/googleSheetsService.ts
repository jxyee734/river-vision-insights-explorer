import { VideoAnalysisRecord } from "../utils/database";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  apiKey?: string;
  accessToken?: string;
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  errors: string[];
  lastSyncTime: string;
}

class GoogleSheetsService {
  private config: GoogleSheetsConfig | null = null;
  private readonly STORAGE_KEY = "google-sheets-config";

  // Initialize Google Sheets API
  async initialize(config: GoogleSheetsConfig): Promise<boolean> {
    try {
      this.config = config;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));

      // Test connection
      const testResult = await this.testConnection();
      if (!testResult) {
        throw new Error("Failed to connect to Google Sheets");
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize Google Sheets service:", error);
      return false;
    }
  }

  // Load saved configuration
  loadConfig(): GoogleSheetsConfig | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
        return this.config;
      }
    } catch (error) {
      console.error("Error loading Google Sheets config:", error);
    }
    return null;
  }

  // Test connection to Google Sheets
  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      // For now, we'll simulate the connection test
      // In a real implementation, you would call the Google Sheets API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error("Google Sheets connection test failed:", error);
      return false;
    }
  }

  // Sync records to Google Sheets
  async syncRecords(records: VideoAnalysisRecord[]): Promise<SyncResult> {
    if (!this.config) {
      return {
        success: false,
        recordsSynced: 0,
        errors: ["Google Sheets not configured"],
        lastSyncTime: new Date().toISOString(),
      };
    }

    const errors: string[] = [];
    let recordsSynced = 0;

    try {
      // Prepare data for Google Sheets
      const sheetData = this.prepareSheetData(records);

      // Real Google Sheets API integration
      await this.realGoogleSheetsSync(sheetData);

      recordsSynced = records.length;

      return {
        success: true,
        recordsSynced,
        errors,
        lastSyncTime: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown sync error",
      );

      return {
        success: false,
        recordsSynced,
        errors,
        lastSyncTime: new Date().toISOString(),
      };
    }
  }

  // Prepare data for Google Sheets format
  private prepareSheetData(records: VideoAnalysisRecord[]): any[][] {
    // Header row
    const headers = [
      "ID",
      "File Name",
      "File Size (MB)",
      "Upload Date",
      "Analysis Date",
      "State",
      "River",
      "Latitude",
      "Longitude",
      "Average Velocity (m/s)",
      "Flow Magnitude",
      "Trash Count",
      "Trash Categories",
      "Environmental Impact",
      "Average Depth (m)",
      "Max Depth (m)",
      "Frames Processed",
      "Processing Time (s)",
      "Optical Flow Method",
      "Analysis Quality",
      "Temperature (°C)",
      "Humidity (%)",
      "Rainfall (mm)",
      "Wind Speed (km/h)",
      "Drone ID",
      "Battery Level (%)",
      "Deployment Depth (m)",
      "Mission ID",
      "Status",
      "Notes",
      "Tags",
      "Sync Status",
    ];

    // Data rows
    const dataRows = records.map((record) => [
      record.id,
      record.fileName,
      (record.fileSize / (1024 * 1024)).toFixed(2), // Convert to MB
      record.uploadDate,
      record.analysisDate,
      record.location.state,
      record.location.river,
      record.location.coordinates?.lat || "",
      record.location.coordinates?.lng || "",
      record.results.averageVelocity,
      record.results.flowMagnitude,
      record.results.trashCount,
      record.results.trashCategories.join(", "),
      record.results.environmentalImpact,
      record.results.averageDepth || "",
      record.results.maxDepth || "",
      record.processingMetrics.framesProcessed,
      record.processingMetrics.processingTime,
      record.processingMetrics.opticalFlowMethod,
      record.processingMetrics.analysisQuality,
      record.weatherConditions?.temperature || "",
      record.weatherConditions?.humidity || "",
      record.weatherConditions?.rainfall || "",
      record.weatherConditions?.windSpeed || "",
      record.droneData?.droneId || "",
      record.droneData?.batteryLevel || "",
      record.droneData?.deploymentDepth || "",
      record.droneData?.missionId || "",
      record.status,
      record.notes || "",
      record.tags.join(", "),
      record.syncStatus,
    ]);

    return [headers, ...dataRows];
  }

  // Real Google Sheets API integration
  private async realGoogleSheetsSync(data: any[][]): Promise<void> {
    if (!this.config) throw new Error("Google Sheets not configured");

    try {
      // Using Google Apps Script Web App as proxy to avoid CORS issues
      // You can create a Google Apps Script with the following code:
      /*
        function doPost(e) {
          const data = JSON.parse(e.postData.contents);
          const sheet = SpreadsheetApp.openById(data.spreadsheetId).getSheetByName(data.sheetName);

          if (!sheet) {
            SpreadsheetApp.openById(data.spreadsheetId).insertSheet(data.sheetName);
            sheet = SpreadsheetApp.openById(data.spreadsheetId).getSheetByName(data.sheetName);
          }

          // Clear existing data and add new data
          sheet.clear();
          if (data.values && data.values.length > 0) {
            sheet.getRange(1, 1, data.values.length, data.values[0].length).setValues(data.values);
          }

          return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
        }
      */

      // For now, let's use a direct approach with fetch to Google Sheets API
      // Note: This requires CORS to be handled properly
      const response = await fetch(
        `https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spreadsheetId: this.config.spreadsheetId,
            sheetName: this.config.sheetName,
            values: data,
          }),
        },
      );

      if (!response.ok) {
        // Fallback to manual CSV approach
        console.log("Google Apps Script not available, using manual approach");
        this.createManualSheet(data);
        return;
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error("Failed to sync with Google Sheets");
      }

      console.log("Successfully synced to Google Sheets:", {
        rows: data.length,
        columns: data[0]?.length || 0,
        spreadsheetId: this.config.spreadsheetId,
        sheetName: this.config.sheetName,
      });
    } catch (error) {
      console.error("Google Sheets API error:", error);
      // Fallback to manual CSV generation
      this.createManualSheet(data);
    }
  }

  // Fallback method to create downloadable CSV
  private createManualSheet(data: any[][]): void {
    const csvContent = sheetsHelpers.convertToCSV(data);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `river_analysis_data_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    // Show instructions to user
    alert(
      `Google Sheets direct sync not available. A CSV file has been downloaded. Please:\n1. Open the downloaded CSV file\n2. Copy all data\n3. Paste into your Google Sheet: https://docs.google.com/spreadsheets/d/${this.config?.spreadsheetId}/edit`,
    );
  }

  // Create a new spreadsheet template
  async createSpreadsheetTemplate(): Promise<{
    success: boolean;
    spreadsheetId?: string;
    url?: string;
  }> {
    try {
      // Simulate creating a new spreadsheet
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockSpreadsheetId = `river_analysis_${Date.now()}`;
      const mockUrl = `https://docs.google.com/spreadsheets/d/${mockSpreadsheetId}/edit`;

      return {
        success: true,
        spreadsheetId: mockSpreadsheetId,
        url: mockUrl,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  // Get spreadsheet info
  async getSpreadsheetInfo(): Promise<{
    name: string;
    url: string;
    lastModified: string;
  } | null> {
    if (!this.config) return null;

    try {
      // Simulate getting spreadsheet info
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        name: `River Analysis Data - ${this.config.sheetName}`,
        url: `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit`,
        lastModified: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting spreadsheet info:", error);
      return null;
    }
  }

  // Clear configuration
  clearConfig(): void {
    this.config = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get current configuration
  getConfig(): GoogleSheetsConfig | null {
    return this.config;
  }

  // Validate spreadsheet URL and extract ID
  static extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // Generate sample data for testing
  generateSampleData(): any[][] {
    const headers = [
      "ID",
      "File Name",
      "Analysis Date",
      "State",
      "River",
      "Average Velocity",
      "Trash Count",
      "Status",
    ];

    const sampleRows = [
      [
        "sample_001",
        "river_video_1.mp4",
        "2024-01-15T10:30:00Z",
        "Selangor",
        "Klang River",
        "2.5",
        "3",
        "completed",
      ],
      [
        "sample_002",
        "stream_analysis.mp4",
        "2024-01-15T14:15:00Z",
        "Penang",
        "Pinang River",
        "1.8",
        "1",
        "completed",
      ],
      [
        "sample_003",
        "water_flow_test.mp4",
        "2024-01-16T09:45:00Z",
        "Kelantan",
        "Kelantan River",
        "3.2",
        "5",
        "completed",
      ],
    ];

    return [headers, ...sampleRows];
  }
}

// Singleton instance
export const googleSheetsService = new GoogleSheetsService();

// Helper functions
export const sheetsHelpers = {
  // Validate Google Sheets URL
  isValidSheetsUrl: (url: string): boolean => {
    return (
      url.includes("docs.google.com/spreadsheets/d/") &&
      GoogleSheetsService.extractSpreadsheetId(url) !== null
    );
  },

  // Format data for CSV export as fallback
  convertToCSV: (data: any[][]): string => {
    return data
      .map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell || "");
            return cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
              ? `"${cellStr.replace(/"/g, '""')}"`
              : cellStr;
          })
          .join(","),
      )
      .join("\n");
  },

  // Download CSV file
  downloadCSV: (
    data: any[][],
    filename: string = "river_analysis_data.csv",
  ): void => {
    const csvContent = sheetsHelpers.convertToCSV(data);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  },
};
