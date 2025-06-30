import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import {
  Database,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  database,
  dbHelpers,
  VideoAnalysisRecord,
  DatabaseStats,
} from "../utils/database";
import {
  googleSheetsService,
  sheetsHelpers,
  SyncResult,
} from "../services/googleSheetsService";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const DatabaseManager: React.FC = () => {
  const [records, setRecords] = useState<VideoAnalysisRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<VideoAnalysisRecord[]>(
    [],
  );
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);

  // Google Sheets integration states
  const [sheetsConfig, setSheetsConfig] = useState({
    spreadsheetId: "",
    sheetName: "River Analysis Data",
    appsScriptUrl: "",
    autoSync: false,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    syncStatus: "all",
    dateRange: { start: "", end: "" },
    location: "",
  });

  useEffect(() => {
    loadData();
    loadSheetsConfig();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, searchQuery, filters]);

  const loadData = () => {
    setIsLoading(true);
    try {
      const allRecords = database.getAllRecords();
      setRecords(allRecords);
      setStats(database.getStats());
    } catch (error) {
      toast.error("Failed to load database records");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetsConfig = () => {
    const config = googleSheetsService.loadConfig();
    if (config) {
      setSheetsConfig({
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        autoSync: false,
      });
      setIsConfigured(true);
    }
  };

  const applyFilters = () => {
    let filtered = records;

    // Search filter
    if (searchQuery.trim()) {
      filtered = dbHelpers.searchRecords(searchQuery);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((record) => record.status === filters.status);
    }

    // Sync status filter
    if (filters.syncStatus !== "all") {
      filtered = filtered.filter(
        (record) => record.syncStatus === filters.syncStatus,
      );
    }

    // Location filter
    if (filters.location.trim()) {
      filtered = filtered.filter(
        (record) =>
          record.location.state
            .toLowerCase()
            .includes(filters.location.toLowerCase()) ||
          record.location.river
            .toLowerCase()
            .includes(filters.location.toLowerCase()),
      );
    }

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.analysisDate);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    setFilteredRecords(filtered);
  };

  const handleRecordSelection = (recordId: string, selected: boolean) => {
    const newSelection = new Set(selectedRecords);
    if (selected) {
      newSelection.add(recordId);
    } else {
      newSelection.delete(recordId);
    }
    setSelectedRecords(newSelection);
  };

  const selectAllRecords = (select: boolean) => {
    if (select) {
      setSelectedRecords(new Set(filteredRecords.map((r) => r.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const deleteSelectedRecords = () => {
    if (selectedRecords.size === 0) return;

    if (
      confirm(
        `Delete ${selectedRecords.size} selected records? This action cannot be undone.`,
      )
    ) {
      selectedRecords.forEach((id) => database.deleteRecord(id));
      setSelectedRecords(new Set());
      loadData();
      toast.success(`${selectedRecords.size} records deleted`);
    }
  };

  const exportData = () => {
    const dataToExport =
      selectedRecords.size > 0
        ? filteredRecords.filter((r) => selectedRecords.has(r.id))
        : filteredRecords;

    const exportJson = database.exportData();
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `river_analysis_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully");
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const result = database.importData(jsonData);

        if (result.success) {
          loadData();
          toast.success(`Imported ${result.imported} records successfully`);
          if (result.errors.length > 0) {
            console.warn("Import warnings:", result.errors);
          }
        } else {
          toast.error(`Import failed: ${result.errors.join(", ")}`);
        }
      } catch (error) {
        toast.error("Failed to import data: Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const configureGoogleSheets = async () => {
    if (!sheetsConfig.spreadsheetId.trim()) {
      toast.error("Please enter a valid spreadsheet ID or URL");
      return;
    }

    setIsLoading(true);
    try {
      // Extract spreadsheet ID from URL if needed
      let spreadsheetId = sheetsConfig.spreadsheetId;
      if (sheetsConfig.spreadsheetId.includes("docs.google.com")) {
        const extractedId =
          googleSheetsService.constructor.extractSpreadsheetId(
            sheetsConfig.spreadsheetId,
          );
        if (!extractedId) {
          throw new Error("Invalid Google Sheets URL");
        }
        spreadsheetId = extractedId;
      }

      const success = await googleSheetsService.initialize({
        spreadsheetId,
        sheetName: sheetsConfig.sheetName || "River Analysis Data",
      });

      if (success) {
        setIsConfigured(true);
        toast.success("Google Sheets configured successfully");
      } else {
        throw new Error("Failed to connect to Google Sheets");
      }
    } catch (error) {
      toast.error(
        "Failed to configure Google Sheets: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const syncToGoogleSheets = async () => {
    if (!isConfigured) {
      toast.error("Please configure Google Sheets first");
      return;
    }

    const recordsToSync =
      selectedRecords.size > 0
        ? filteredRecords.filter((r) => selectedRecords.has(r.id))
        : filteredRecords.filter((r) => r.syncStatus === "pending");

    if (recordsToSync.length === 0) {
      toast.info("No records to sync");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await googleSheetsService.syncRecords(recordsToSync);
      setSyncStatus(result);

      if (result.success) {
        // Update sync status in database
        recordsToSync.forEach((record) => {
          database.updateSyncStatus(record.id, "synced");
        });
        loadData();
        toast.success(
          `Successfully synced ${result.recordsSynced} records to Google Sheets`,
        );
      } else {
        toast.error(`Sync failed: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      toast.error(
        "Sync failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToCSV = () => {
    const recordsToExport =
      selectedRecords.size > 0
        ? filteredRecords.filter((r) => selectedRecords.has(r.id))
        : filteredRecords;

    if (recordsToExport.length === 0) {
      toast.error("No records to export");
      return;
    }

    const sheetsData = recordsToExport.map((record) => [
      record.id,
      record.fileName,
      record.analysisDate,
      record.location.state,
      record.location.river,
      record.results.averageVelocity,
      record.results.flowMagnitude,
      record.results.trashCount,
      record.results.trashCategories.join("; "),
      record.status,
      record.syncStatus,
    ]);

    const headers = [
      "ID",
      "File Name",
      "Analysis Date",
      "State",
      "River",
      "Avg Velocity",
      "Flow Magnitude",
      "Trash Count",
      "Trash Categories",
      "Status",
      "Sync Status",
    ];

    sheetsHelpers.downloadCSV(
      [headers, ...sheetsData],
      `river_analysis_${new Date().toISOString().split("T")[0]}.csv`,
    );
    toast.success("CSV exported successfully");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getSyncStatusBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case "synced":
        return <Badge className="bg-green-500">Synced</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Database Management & Google Sheets Sync
          </CardTitle>
          <CardDescription>
            Manage your video analysis data and sync with Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="sync">Google Sheets</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Total Records</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.totalRecords}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Successful</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.successfulAnalyses}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Synced</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.syncedRecords}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Pending Sync</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.pendingSync}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button
                        onClick={loadData}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                      <Button
                        onClick={exportData}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export to CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Database Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span>
                          {stats ? formatFileSize(stats.totalSize) : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Processing Time:</span>
                        <span>
                          {stats
                            ? stats.averageProcessingTime.toFixed(1)
                            : "N/A"}
                          s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Most Common Location:</span>
                        <span className="text-right">
                          {stats?.mostCommonLocation || "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectAllRecords(selectedRecords.size === 0)}
                  >
                    {selectedRecords.size === 0 ? "Select All" : "Deselect All"}
                  </Button>
                  {selectedRecords.size > 0 && (
                    <>
                      <Button variant="outline" onClick={deleteSelectedRecords}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete ({selectedRecords.size})
                      </Button>
                      <Button variant="outline" onClick={syncToGoogleSheets}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Sync Selected
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {filteredRecords.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedRecords.has(record.id)}
                          onChange={(e) =>
                            handleRecordSelection(record.id, e.target.checked)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{record.fileName}</h4>
                            {getStatusIcon(record.status)}
                            {getSyncStatusBadge(record.syncStatus)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Location:</span>
                              <p>
                                {record.location.state} -{" "}
                                {record.location.river}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">
                                Analysis Date:
                              </span>
                              <p>
                                {new Date(
                                  record.analysisDate,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Results:</span>
                              <p>
                                Velocity:{" "}
                                {record.results.averageVelocity.toFixed(2)} m/s
                              </p>
                              <p>Trash: {record.results.trashCount} items</p>
                            </div>
                            <div>
                              <span className="font-medium">Processing:</span>
                              <p>
                                {record.processingMetrics.framesProcessed}{" "}
                                frames
                              </p>
                              <p>
                                {record.processingMetrics.processingTime.toFixed(
                                  1,
                                )}
                                s
                              </p>
                            </div>
                          </div>

                          {record.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Notes:</span>{" "}
                              {record.notes}
                            </p>
                          )}

                          <div className="flex gap-1 mt-2">
                            {record.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredRecords.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No records found</p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchQuery("")}
                          className="mt-2"
                        >
                          Clear Search
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Google Sheets Configuration</CardTitle>
                  <CardDescription>
                    Connect your Google Sheets to automatically sync analysis
                    data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertTitle>Setup Instructions</AlertTitle>
                    <AlertDescription>
                      To enable automatic sync to Google Sheets, you need to
                      deploy a Google Apps Script.
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Click for detailed setup instructions
                        </summary>
                        <div className="mt-2 text-sm space-y-1">
                          <p>
                            1. Go to{" "}
                            <a
                              href="https://script.google.com/"
                              target="_blank"
                              className="text-blue-600 underline"
                            >
                              script.google.com
                            </a>
                          </p>
                          <p>2. Create a new project</p>
                          <p>
                            3. Copy the code from our GitHub repository
                            (google-apps-script.js)
                          </p>
                          <p>4. Deploy as a web app with "Anyone" access</p>
                          <p>5. Copy the deployment URL and paste it below</p>
                        </div>
                      </details>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label>
                        Google Apps Script URL (Required for auto-sync)
                      </Label>
                      <Input
                        value={sheetsConfig.appsScriptUrl}
                        onChange={(e) =>
                          setSheetsConfig({
                            ...sheetsConfig,
                            appsScriptUrl: e.target.value,
                          })
                        }
                        placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Spreadsheet ID or URL</Label>
                        <Input
                          value={sheetsConfig.spreadsheetId}
                          onChange={(e) =>
                            setSheetsConfig({
                              ...sheetsConfig,
                              spreadsheetId: e.target.value,
                            })
                          }
                          placeholder="Enter Google Sheets URL or ID"
                        />
                      </div>
                      <div>
                        <Label>Sheet Name</Label>
                        <Input
                          value={sheetsConfig.sheetName}
                          onChange={(e) =>
                            setSheetsConfig({
                              ...sheetsConfig,
                              sheetName: e.target.value,
                            })
                          }
                          placeholder="Sheet name (e.g., 'River Analysis Data')"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={configureGoogleSheets}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4 mr-2" />
                      )}
                      {isConfigured
                        ? "Update Configuration"
                        : "Configure Google Sheets"}
                    </Button>

                    {isConfigured && (
                      <Button
                        variant="outline"
                        onClick={syncToGoogleSheets}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Sync Now
                      </Button>
                    )}
                  </div>

                  {isConfigured && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Google Sheets Connected</AlertTitle>
                      <AlertDescription>
                        Your data will be synced to the configured Google Sheet.
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() =>
                            window.open(
                              `https://docs.google.com/spreadsheets/d/${sheetsConfig.spreadsheetId}/edit`,
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Spreadsheet
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {syncStatus && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Last Sync Result</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span
                              className={
                                syncStatus.success
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {syncStatus.success ? "Success" : "Failed"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Records Synced:</span>
                            <span>{syncStatus.recordsSynced}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Sync:</span>
                            <span>
                              {new Date(
                                syncStatus.lastSyncTime,
                              ).toLocaleString()}
                            </span>
                          </div>
                          {syncStatus.errors.length > 0 && (
                            <div className="text-red-600">
                              <span>Errors:</span>
                              <ul className="list-disc pl-4">
                                {syncStatus.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Database Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Import Data</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("import-file")?.click()
                          }
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import JSON
                        </Button>
                        <input
                          id="import-file"
                          type="file"
                          accept=".json"
                          onChange={importData}
                          style={{ display: "none" }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Export Options</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" onClick={exportData}>
                          <Download className="h-4 w-4 mr-2" />
                          Export JSON
                        </Button>
                        <Button variant="outline" onClick={exportToCSV}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-red-600">Danger Zone</Label>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (
                              confirm(
                                "This will permanently delete all data. Are you sure?",
                              )
                            ) {
                              database.clearDatabase();
                              setRecords([]);
                              setFilteredRecords([]);
                              setStats(null);
                              toast.success("Database cleared");
                            }
                          }}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManager;
