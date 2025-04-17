import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import ApplicationUsageChart from "@/components/dashboard/ApplicationUsageChart";
import { useQuery } from "@tanstack/react-query";

export default function Applications() {
  const [timeRange, setTimeRange] = useState("last7days");
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/applications", timeRange, category],
    queryFn: async () => {
      // This would fetch from the API in a production environment
      return [
        { id: 1, name: "Microsoft Teams", category: "productive", time: 135, timeFormatted: "2h 15m" },
        { id: 2, name: "Visual Studio Code", category: "productive", time: 108, timeFormatted: "1h 48m" },
        { id: 3, name: "Outlook", category: "productive", time: 55, timeFormatted: "55m" },
        { id: 4, name: "Google Chrome", category: "neutral", time: 90, timeFormatted: "1h 30m" },
        { id: 5, name: "Slack", category: "productive", time: 45, timeFormatted: "45m" },
        { id: 6, name: "PowerPoint", category: "productive", time: 35, timeFormatted: "35m" },
        { id: 7, name: "Excel", category: "productive", time: 30, timeFormatted: "30m" },
        { id: 8, name: "Zoom", category: "productive", time: 25, timeFormatted: "25m" },
        { id: 9, name: "Photoshop", category: "productive", time: 20, timeFormatted: "20m" },
        { id: 10, name: "Word", category: "productive", time: 15, timeFormatted: "15m" },
      ];
    },
  });

  // Filter applications based on search query and category
  const filteredApplications = applications?.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (category === "all" || app.category === category)
  ) || [];

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'productive':
        return 'bg-accent/10 text-accent';
      case 'neutral':
        return 'bg-warning/10 text-warning';
      case 'unproductive':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-neutral-light text-neutral-medium';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Applications</h1>
          <p className="text-neutral-medium">Track and analyze application usage</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last90days">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ApplicationUsageChart />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                  <span>Productive</span>
                </div>
                <span className="font-medium">8 apps</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-warning mr-2"></div>
                  <span>Neutral</span>
                </div>
                <span className="font-medium">1 app</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
                  <span>Unproductive</span>
                </div>
                <span className="font-medium">0 apps</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Button variant="outline" className="w-full">
                Manage Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Applications List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium h-4 w-4" />
              <Input
                type="text"
                placeholder="Search applications..."
                className="pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="productive">Productive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="unproductive">Unproductive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Time Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getCategoryBadgeClass(app.category)}`}>
                          {app.category.charAt(0).toUpperCase() + app.category.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{app.timeFormatted}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
