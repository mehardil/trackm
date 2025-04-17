import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useQuery } from "@tanstack/react-query";

export default function Productivity() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("last7days");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/productivity/trends", timeRange],
    queryFn: () => {
      // This would be a real API call in a production environment
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return days.map(day => ({
        name: day,
        productivity: Math.floor(Math.random() * 30) + 60,
      }));
    },
  });

  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ["/api/productivity/comparison", timeRange],
    queryFn: () => {
      // This would be a real API call in a production environment
      return [
        { name: "Current Period", productive: 65, neutral: 25, unproductive: 10 },
        { name: "Previous Period", productive: 58, neutral: 29, unproductive: 13 }
      ];
    },
  });

  const { data: distributionData, isLoading: distributionLoading } = useQuery({
    queryKey: ["/api/productivity/distribution", timeRange],
    queryFn: () => {
      // This would be a real API call in a production environment
      return [
        { name: "Development", productivity: 82 },
        { name: "Research", productivity: 75 },
        { name: "Communication", productivity: 68 },
        { name: "Documentation", productivity: 70 },
        { name: "Meetings", productivity: 55 },
        { name: "Social Media", productivity: 25 },
      ];
    },
  });

  const productivityColors = {
    high: "#107C10",
    medium: "#FFB900",
    low: "#E81123"
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Productivity</h1>
          <p className="text-neutral-medium">Deep dive into productivity metrics and patterns</p>
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
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productivity Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {trendLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <p>Loading trend data...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} label={{ value: 'Productivity Score (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, "Productivity"]} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="productivity"
                            stroke="#0078D4"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Period Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {comparisonLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <p>Loading comparison data...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={comparisonData}
                          layout="vertical"
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip formatter={(value) => [`${value}%`, ""]} />
                          <Legend />
                          <Bar dataKey="productive" name="Productive" stackId="a" fill={productivityColors.high} />
                          <Bar dataKey="neutral" name="Neutral" stackId="a" fill={productivityColors.medium} />
                          <Bar dataKey="unproductive" name="Unproductive" stackId="a" fill={productivityColors.low} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <CategoryBreakdown />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calendar View</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  <div className="mt-4 text-sm text-center text-neutral-medium">
                    Select a date to view detailed productivity metrics
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Long-term Productivity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <p className="text-neutral-medium">
                  This view shows how productivity metrics have changed over time, helping identify patterns and improvements.
                </p>
                <div className="mt-4 h-80">
                  {trendLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p>Loading trend data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, "Productivity"]} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="productivity"
                          stroke="#0078D4"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {distributionLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p>Loading distribution data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={distributionData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} label={{ value: 'Productivity Score (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`${value}%`, "Productivity"]} />
                        <Bar dataKey="productivity" fill="#0078D4">
                          {distributionData?.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.productivity >= 75 ? productivityColors.high :
                                entry.productivity >= 50 ? productivityColors.medium :
                                productivityColors.low
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <p className="text-neutral-medium mb-4">
                    This chart shows how team members are distributed across productivity levels.
                  </p>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "High (75-100%)", value: 8, color: productivityColors.high },
                          { name: "Medium (50-74%)", value: 5, color: productivityColors.medium },
                          { name: "Low (0-49%)", value: 3, color: productivityColors.low }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "High (75-100%)", value: 8, color: productivityColors.high },
                          { name: "Medium (50-74%)", value: 5, color: productivityColors.medium },
                          { name: "Low (0-49%)", value: 3, color: productivityColors.low }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Team Members"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
