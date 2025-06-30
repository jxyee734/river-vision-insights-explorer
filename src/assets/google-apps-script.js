/**
 * Google Apps Script for River Analysis Data Sync
 *
 * Instructions to set up:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Save the project with a name like "River Analysis Sync"
 * 5. Click "Deploy" > "New deployment"
 * 6. Choose "Web app" as the type
 * 7. Set execute as "Me" and access to "Anyone"
 * 8. Copy the deployment URL and use it in the River Analysis app
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Validate required parameters
    if (!data.spreadsheetId || !data.sheetName || !data.values) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error:
            "Missing required parameters: spreadsheetId, sheetName, or values",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Open the spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(data.spreadsheetId);
    } catch (error) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Invalid spreadsheet ID or no access to spreadsheet",
        }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Get or create the sheet
    let sheet = spreadsheet.getSheetByName(data.sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(data.sheetName);
    }

    // Clear existing data
    sheet.clear();

    // Add new data
    if (data.values && data.values.length > 0) {
      const range = sheet.getRange(
        1,
        1,
        data.values.length,
        data.values[0].length,
      );
      range.setValues(data.values);

      // Format the header row
      if (data.values.length > 0) {
        const headerRange = sheet.getRange(1, 1, 1, data.values[0].length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#4285f4");
        headerRange.setFontColor("#ffffff");
      }

      // Auto-resize columns
      sheet.autoResizeColumns(1, data.values[0].length);

      // Freeze the header row
      sheet.setFrozenRows(1);
    }

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        rowsUpdated: data.values.length,
        sheetUrl: spreadsheet.getUrl(),
        timestamp: new Date().toISOString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests for testing
  return ContentService.createTextOutput(
    JSON.stringify({
      message: "River Analysis Data Sync API is running",
      version: "1.0",
      timestamp: new Date().toISOString(),
      usage:
        "Send POST requests with JSON data containing spreadsheetId, sheetName, and values array",
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

// Test function to verify the script works
function testScript() {
  const testData = {
    spreadsheetId: "YOUR_SPREADSHEET_ID_HERE", // Replace with actual spreadsheet ID
    sheetName: "Test Sheet",
    values: [
      ["ID", "File Name", "Analysis Date", "State", "River", "Video URL"],
      [
        "test_001",
        "sample_video.mp4",
        "2024-01-15",
        "Selangor",
        "Klang River",
        "https://example.com/video1",
      ],
      [
        "test_002",
        "river_analysis.mp4",
        "2024-01-16",
        "Penang",
        "Pinang River",
        "https://example.com/video2",
      ],
    ],
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData),
    },
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
