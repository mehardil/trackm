import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Download, FileText, FileSpreadsheet, FileJson, Calendar as CalendarIcon, Filter, ChartBar, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useActivity } from "@/hooks/useActivity";
import { useTeam } from "@/hooks/useTeam";

export default function ExportData() {
  const [activeTab, setActiveTab] = useState("activity");
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { exportActivity } = useActivity();
  const { getUsers } = useTeam();
  
  // Simplified helper for format that would normally come from an API
  const { data: users } = {
    data: [
      { id: 1, name: "Amy Kirkland", department: "Development" },
      { id: 2, name: "John Miller", department: "Marketing" },
      { id: 3, name: "Sarah Lee", department: "Sales" },
      { id: 4, name: "Robert Johnson", department: "HR" }
    ]
  };

  // Handle export
  const handleExport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date range required",
        description: "Please select a start and end date for your export.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    
    try {
      // This would be a real API call in a production environment
      // For demo purposes, simulate a download delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Export successful",
        description: `Your ${activeTab} data has been exported in ${exportFormat.toUpperCase()} format.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was a problem exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Get export icon based on format
  const getExportIcon = () => {
    switch (exportFormat) {
      case 'csv':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 mr-2" />;
      case 'json':
        return <FileJson className="h-4 w-4 mr-2" />;
      default:
        return <Download className="h-4 w-4 mr-2" />;
    }
  };

  // Handle user selection
  const toggleUserSelection = (userId: number) => {
    const id = userId.toString();
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(u => u !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  // Select/deselect all users
  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id.toString()));
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Export Data</h1>
          <p className="text-neutral-medium">Export reports and data for analysis</p>
        </div>
      </div>

      <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="activity">Activity Data</TabsTrigger>
          <TabsTrigger value="productivity">Productivity Reports</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Activity Data</CardTitle>
              <CardDescription>
                Export detailed activity records for analysis and reporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="mb-2 block">Date Range</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              format(dateRange.from, "PPP")
                            ) : (
                              <span>Start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? (
                              format(dateRange.to, "PPP")
                            ) : (
                              <span>End date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const today = new Date();
                          setDateRange({
                            from: new Date(today.setDate(today.getDate() - 7)),
                            to: new Date()
                          });
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateRange({
                            from: new Date(today.setDate(today.getDate() - 30)),
                            to: new Date()
                          });
                        }}
                      >
                        Last 30 days
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateRange({
                            from: new Date(today.setDate(today.getDate() - 90)),
                            to: new Date()
                          });
                        }}
                      >
                        Last 90 days
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="mb-2 block">Team Members</Label>
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2 pb-2 border-b">
                    <Checkbox 
                      id="select-all" 
                      checked={selectedUsers.length === users.length} 
                      onCheckedChange={toggleAllUsers}
                    />
                    <label htmlFor="select-all" className="ml-2 text-sm font-medium">
                      Select All
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center">
                        <Checkbox 
                          id={`user-${user.id}`} 
                          checked={selectedUsers.includes(user.id.toString())}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <label htmlFor={`user-${user.id}`} className="ml-2 text-sm">
                          {user.name} <span className="text-xs text-neutral-medium">({user.department})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Checkbox 
                    id="include-inactive" 
                    checked={includeInactive}
                    onCheckedChange={(checked) => setIncludeInactive(!!checked)}
                  />
                  <label htmlFor="include-inactive" className="ml-2 text-sm">
                    Include inactive periods
                  </label>
                </div>
                
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-start mb-2">
                    <Filter className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Advanced Filters</h3>
                      <p className="text-sm text-neutral-medium mb-4">
                        Customize your export with additional filters
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">Activity Category</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="productive">Productive</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="unproductive">Unproductive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs mb-1 block">Activity Type</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Activity</SelectItem>
                          <SelectItem value="application">Applications</SelectItem>
                          <SelectItem value="website">Websites</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs mb-1 block">Time Range</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Day</SelectItem>
                          <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                          <SelectItem value="evening">Evening (5pm-8pm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleExport} 
                  disabled={isDownloading || !dateRange.from || !dateRange.to || selectedUsers.length === 0}
                  className="flex items-center"
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-2">⋯</span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      {getExportIcon()}
                      Export Activity Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Productivity Reports</CardTitle>
              <CardDescription>
                Generate comprehensive productivity reports for analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="mb-2 block">Report Type</Label>
                  <Select defaultValue="summary">
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Productivity Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Productivity</SelectItem>
                      <SelectItem value="comparison">Team Comparison</SelectItem>
                      <SelectItem value="trend">Productivity Trends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Date Range</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              format(dateRange.from, "PPP")
                            ) : (
                              <span>Start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? (
                              format(dateRange.to, "PPP")
                            ) : (
                              <span>End date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="mb-2 block">Include Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="include-productivity" defaultChecked />
                    <label htmlFor="include-productivity" className="ml-2 text-sm">
                      Productivity scores
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-categories" defaultChecked />
                    <label htmlFor="include-categories" className="ml-2 text-sm">
                      Activity categories
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-applications" defaultChecked />
                    <label htmlFor="include-applications" className="ml-2 text-sm">
                      Top applications used
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-websites" defaultChecked />
                    <label htmlFor="include-websites" className="ml-2 text-sm">
                      Top websites visited
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-hours" defaultChecked />
                    <label htmlFor="include-hours" className="ml-2 text-sm">
                      Working hours
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="mb-2 block">Report Format</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4 hover:border-primary cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-primary mr-2" />
                        <span className="font-medium">CSV</span>
                      </div>
                      <Checkbox checked={exportFormat === "csv"} onCheckedChange={() => setExportFormat("csv")} />
                    </div>
                    <p className="text-xs text-neutral-medium mt-2">
                      Standard format for data analysis
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:border-primary cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-5 w-5 text-primary mr-2" />
                        <span className="font-medium">Excel</span>
                      </div>
                      <Checkbox checked={exportFormat === "excel"} onCheckedChange={() => setExportFormat("excel")} />
                    </div>
                    <p className="text-xs text-neutral-medium mt-2">
                      Includes data and charts
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:border-primary cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChartBar className="h-5 w-5 text-primary mr-2" />
                        <span className="font-medium">PDF Report</span>
                      </div>
                      <Checkbox checked={exportFormat === "pdf"} onCheckedChange={() => setExportFormat("pdf")} />
                    </div>
                    <p className="text-xs text-neutral-medium mt-2">
                      Complete formatted report
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleExport} 
                  disabled={isDownloading || !dateRange.from || !dateRange.to}
                  className="flex items-center"
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-2">⋯</span>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      {getExportIcon()}
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Applications Data</CardTitle>
              <CardDescription>
                Export application usage data for detailed analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Label className="mb-2 block">Date Range</Label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "PPP")
                          ) : (
                            <span>Start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "PPP")
                          ) : (
                            <span>End date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Application Category</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="productive">Productive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="unproductive">Unproductive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="mb-2 block">Applications to Include</Label>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <Checkbox id="app-msoffice" defaultChecked />
                      <label htmlFor="app-msoffice" className="ml-2 text-sm">
                        Microsoft Office
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-vscode" defaultChecked />
                      <label htmlFor="app-vscode" className="ml-2 text-sm">
                        Visual Studio Code
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-chrome" defaultChecked />
                      <label htmlFor="app-chrome" className="ml-2 text-sm">
                        Google Chrome
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-slack" defaultChecked />
                      <label htmlFor="app-slack" className="ml-2 text-sm">
                        Slack
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-teams" defaultChecked />
                      <label htmlFor="app-teams" className="ml-2 text-sm">
                        Microsoft Teams
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-photoshop" defaultChecked />
                      <label htmlFor="app-photoshop" className="ml-2 text-sm">
                        Photoshop
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-salesforce" defaultChecked />
                      <label htmlFor="app-salesforce" className="ml-2 text-sm">
                        Salesforce
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-zoom" defaultChecked />
                      <label htmlFor="app-zoom" className="ml-2 text-sm">
                        Zoom
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="app-other" defaultChecked />
                      <label htmlFor="app-other" className="ml-2 text-sm">
                        Other Applications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="mb-2 block">Data to Include</Label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="include-usage-time" defaultChecked />
                    <label htmlFor="include-usage-time" className="ml-2 text-sm">
                      Usage time
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-usage-percent" defaultChecked />
                    <label htmlFor="include-usage-percent" className="ml-2 text-sm">
                      Usage percentage
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-category-rating" defaultChecked />
                    <label htmlFor="include-category-rating" className="ml-2 text-sm">
                      Productivity category
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="include-usage-by-hour" defaultChecked />
                    <label htmlFor="include-usage-by-hour" className="ml-2 text-sm">
                      Usage breakdown by hour
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleExport} 
                  disabled={isDownloading || !dateRange.from || !dateRange.to}
                  className="flex items-center"
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-2">⋯</span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      {getExportIcon()}
                      Export Applications Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Websites Data</CardTitle>
              <CardDescription>
                Export website usage data for detailed analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Label className="mb-2 block">Date Range</Label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            format(dateRange.from, "PPP")
                          ) : (
                            <span>Start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? (
                            format(dateRange.to, "PPP")
                          ) : (
                            <span>End date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Website Category</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="productive">Productive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="unproductive">Unproductive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="mb-2 block">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <Label className="mb-2 block">Top Websites to Include</Label>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Checkbox id="site-github" defaultChecked />
                      <label htmlFor="site-github" className="ml-2 text-sm">
                        github.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-docs" defaultChecked />
                      <label htmlFor="site-docs" className="ml-2 text-sm">
                        docs.google.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-youtube" defaultChecked />
                      <label htmlFor="site-youtube" className="ml-2 text-sm">
                        youtube.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-slack" defaultChecked />
                      <label htmlFor="site-slack" className="ml-2 text-sm">
                        slack.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-stackoverflow" defaultChecked />
                      <label htmlFor="site-stackoverflow" className="ml-2 text-sm">
                        stackoverflow.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-linkedin" defaultChecked />
                      <label htmlFor="site-linkedin" className="ml-2 text-sm">
                        linkedin.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-twitter" defaultChecked />
                      <label htmlFor="site-twitter" className="ml-2 text-sm">
                        twitter.com
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="site-facebook" defaultChecked />
                      <label htmlFor="site-facebook" className="ml-2 text-sm">
                        facebook.com
                      </label>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center">
                      <Checkbox id="site-other" defaultChecked />
                      <label htmlFor="site-other" className="ml-2 text-sm">
                        Include other websites (if above selection limit)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10 mb-6">
                <div className="flex items-start mb-2">
                  <Filter className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Advanced Filters</h3>
                    <p className="text-sm text-neutral-medium mb-4">
                      Further customize your website export
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs mb-1 block">Minimum Time Threshold</Label>
                    <div className="flex space-x-2">
                      <Input type="number" min="0" defaultValue="5" className="w-20" />
                      <Select defaultValue="minutes">
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seconds">Seconds</SelectItem>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-neutral-medium mt-1">
                      Only include websites with usage above this threshold
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs mb-1 block">Domain Grouping</Label>
                    <Select defaultValue="top-level">
                      <SelectTrigger>
                        <SelectValue placeholder="Select grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No grouping</SelectItem>
                        <SelectItem value="top-level">Group by top-level domain</SelectItem>
                        <SelectItem value="sub-domain">Include subdomains</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-medium mt-1">
                      How to group different domains in the report
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleExport} 
                  disabled={isDownloading || !dateRange.from || !dateRange.to}
                  className="flex items-center"
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-2">⋯</span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      {getExportIcon()}
                      Export Websites Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>
            Your previous data exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Activity Report</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Apr 1 - Apr 7, 2023</TableCell>
                  <TableCell>Apr 8, 2023</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-primary" />
                      <span>CSV</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Download</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity Summary</TableCell>
                  <TableCell>Productivity</TableCell>
                  <TableCell>Mar 1 - Mar 31, 2023</TableCell>
                  <TableCell>Apr 2, 2023</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-1 text-primary" />
                      <span>Excel</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Download</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Application Usage</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Mar 15 - Mar 31, 2023</TableCell>
                  <TableCell>Apr 1, 2023</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileJson className="h-4 w-4 mr-1 text-primary" />
                      <span>JSON</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Download</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
