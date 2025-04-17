import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Filter, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function WorkHours() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("last7days");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: hoursData, isLoading: hoursLoading } = useQuery({
    queryKey: ["/api/work-hours/overview", timeRange, selectedUser],
    queryFn: async () => {
      // This would be a real API call in a production environment
      return [
        { day: "Mon", hours: 7.5 },
        { day: "Tue", hours: 8.2 },
        { day: "Wed", hours: 6.8 },
        { day: "Thu", hours: 9.0 },
        { day: "Fri", hours: 7.2 },
        { day: "Sat", hours: 2.5 },
        { day: "Sun", hours: 0.5 },
      ];
    },
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["/api/work-hours/team", timeRange],
    queryFn: async () => {
      // This would be a real API call in a production environment
      return [
        { id: 1, name: "Amy Kirkland", department: "Development", averageHours: 8.2, totalHours: 41, avatarColor: "#0078D4" },
        { id: 2, name: "John Miller", department: "Marketing", averageHours: 7.5, totalHours: 37.5, avatarColor: "#2B88D8" },
        { id: 3, name: "Sarah Lee", department: "Sales", averageHours: 9.1, totalHours: 45.5, avatarColor: "#FFB900" },
        { id: 4, name: "Robert Johnson", department: "HR", averageHours: 6.3, totalHours: 31.5, avatarColor: "#E81123" },
      ];
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const totalWorkHours = hoursData?.reduce((sum, day) => sum + day.hours, 0) || 0;
  const averageWorkHours = totalWorkHours / (hoursData?.length || 1);
  
  const getHoursClassification = (hours: number) => {
    if (hours > 8) return "Over-time";
    if (hours >= 7.5) return "Regular";
    if (hours >= 6) return "Slightly Under";
    return "Significantly Under";
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Work Hours</h1>
          <p className="text-neutral-medium">Track and analyze working time patterns</p>
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
          <Button className="flex items-center">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Work Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Work Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {hoursLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <p>Loading hours data...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={hoursData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value} hours`, "Work Time"]} />
                          <Legend />
                          <Bar 
                            dataKey="hours" 
                            fill="#0078D4" 
                            name="Work Hours"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedUser !== "all" && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Hourly Activity Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { hour: "8 AM", activity: 75 },
                            { hour: "9 AM", activity: 90 },
                            { hour: "10 AM", activity: 85 },
                            { hour: "11 AM", activity: 65 },
                            { hour: "12 PM", activity: 40 },
                            { hour: "1 PM", activity: 60 },
                            { hour: "2 PM", activity: 95 },
                            { hour: "3 PM", activity: 85 },
                            { hour: "4 PM", activity: 70 },
                            { hour: "5 PM", activity: 50 },
                          ]}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis domain={[0, 100]} label={{ value: 'Activity (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, "Activity Level"]} />
                          <Line
                            type="monotone"
                            dataKey="activity"
                            stroke="#107C10"
                            strokeWidth={2}
                            dot={{ fill: "#107C10" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Work Hours Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-neutral-medium">Total Hours:</div>
                      <div className="font-semibold text-xl">{totalWorkHours.toFixed(1)} hrs</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-neutral-medium">Daily Average:</div>
                      <div className="font-semibold text-xl">{averageWorkHours.toFixed(1)} hrs</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-neutral-medium">Classification:</div>
                      <div className="font-semibold text-primary">{getHoursClassification(averageWorkHours)}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Hours Distribution</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "< 6 hours", value: 1, color: "#E81123" },
                              { name: "6-7.5 hours", value: 1, color: "#FFB900" },
                              { name: "7.5-8 hours", value: 3, color: "#107C10" },
                              { name: "> 8 hours", value: 2, color: "#0078D4" },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: "< 6 hours", value: 1, color: "#E81123" },
                              { name: "6-7.5 hours", value: 1, color: "#FFB900" },
                              { name: "7.5-8 hours", value: 3, color: "#107C10" },
                              { name: "> 8 hours", value: 2, color: "#0078D4" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, "Days"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    Select a date to view detailed work hours
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle className="text-lg">Team Work Hours</CardTitle>
                <div className="mt-2 md:mt-0">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Members</SelectItem>
                      <SelectItem value="1">Amy Kirkland</SelectItem>
                      <SelectItem value="2">John Miller</SelectItem>
                      <SelectItem value="3">Sarah Lee</SelectItem>
                      <SelectItem value="4">Robert Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Avg. Hours/Day</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading team data...
                        </TableCell>
                      </TableRow>
                    ) : teamData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No team members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamData?.map((member) => (
                        <TableRow key={member.id} className="hover:bg-neutral-light/20">
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2" style={{ backgroundColor: `${member.avatarColor}20`, color: member.avatarColor }}>
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              <div>{member.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{member.department}</TableCell>
                          <TableCell>{member.averageHours.toFixed(1)} hrs</TableCell>
                          <TableCell>{member.totalHours.toFixed(1)} hrs</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              member.averageHours > 8 ? 'bg-primary/10 text-primary' :
                              member.averageHours >= 7.5 ? 'bg-accent/10 text-accent' :
                              member.averageHours >= 6 ? 'bg-warning/10 text-warning' :
                              'bg-danger/10 text-danger'
                            }`}>
                              {getHoursClassification(member.averageHours)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department Hours Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { department: "Development", hours: 8.2 },
                        { department: "Marketing", hours: 7.5 },
                        { department: "Sales", hours: 9.1 },
                        { department: "HR", hours: 6.3 },
                        { department: "Design", hours: 7.8 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis label={{ value: 'Avg Hours/Day', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} hours`, "Average"]} />
                      <Bar 
                        dataKey="hours" 
                        fill="#0078D4" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Hours Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Over-time (>8h)", value: 6, color: "#0078D4" },
                          { name: "Regular (7.5-8h)", value: 8, color: "#107C10" },
                          { name: "Slightly Under (6-7.5h)", value: 3, color: "#FFB900" },
                          { name: "Significantly Under (<6h)", value: 1, color: "#E81123" },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "Over-time (>8h)", value: 6, color: "#0078D4" },
                          { name: "Regular (7.5-8h)", value: 8, color: "#107C10" },
                          { name: "Slightly Under (6-7.5h)", value: 3, color: "#FFB900" },
                          { name: "Significantly Under (<6h)", value: 1, color: "#E81123" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Team Members"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Arrival & Departure Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { hour: "7 AM", arrivals: 2, departures: 0 },
                        { hour: "8 AM", arrivals: 8, departures: 0 },
                        { hour: "9 AM", arrivals: 5, departures: 0 },
                        { hour: "10 AM", arrivals: 1, departures: 0 },
                        { hour: "4 PM", arrivals: 0, departures: 3 },
                        { hour: "5 PM", arrivals: 0, departures: 7 },
                        { hour: "6 PM", arrivals: 0, departures: 5 },
                        { hour: "7 PM", arrivals: 0, departures: 1 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis label={{ value: 'Team Members', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="arrivals"
                        stroke="#107C10"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="departures"
                        stroke="#0078D4"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Hours by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: "Monday", hours: 7.8 },
                        { day: "Tuesday", hours: 8.2 },
                        { day: "Wednesday", hours: 8.5 },
                        { day: "Thursday", hours: 8.3 },
                        { day: "Friday", hours: 7.4 },
                        { day: "Saturday", hours: 2.1 },
                        { day: "Sunday", hours: 0.6 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis label={{ value: 'Avg Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} hours`, "Average"]} />
                      <Bar 
                        dataKey="hours" 
                        fill="#0078D4"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Work Pattern Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Peak Productivity</h3>
                  </div>
                  <p className="text-sm text-neutral-medium">
                    Most team members are most productive during <span className="font-semibold">9 AM - 11 AM</span> and <span className="font-semibold">2 PM - 4 PM</span>.
                  </p>
                </div>
                
                <div className="bg-warning/5 rounded-lg p-4 border border-warning/10">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-warning mr-2" />
                    <h3 className="font-medium">Common Break Times</h3>
                  </div>
                  <p className="text-sm text-neutral-medium">
                    Most team members take breaks around <span className="font-semibold">12 PM - 1 PM</span> for lunch and short breaks at <span className="font-semibold">10:30 AM</span> and <span className="font-semibold">3:30 PM</span>.
                  </p>
                </div>
                
                <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-accent mr-2" />
                    <h3 className="font-medium">Overtime Patterns</h3>
                  </div>
                  <p className="text-sm text-neutral-medium">
                    <span className="font-semibold">35%</span> of the team regularly works overtime, primarily on <span className="font-semibold">Tuesdays</span> and <span className="font-semibold">Wednesdays</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
