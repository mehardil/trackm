import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, TrendingUp, TrendingDown, AlertTriangle, Check } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { useQuery } from "@tanstack/react-query";

export default function TeamEfficiency() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("last7days");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["/api/team-efficiency/overview", timeRange, departmentFilter],
    queryFn: async () => {
      // This would be a real API call in a production environment
      return [
        { id: 1, name: "Amy Kirkland", department: "Development", efficiency: 85, productivity: 90, quality: 80, avatarColor: "#0078D4" },
        { id: 2, name: "John Miller", department: "Marketing", efficiency: 68, productivity: 65, quality: 72, avatarColor: "#2B88D8" },
        { id: 3, name: "Sarah Lee", department: "Sales", efficiency: 92, productivity: 95, quality: 88, avatarColor: "#FFB900" },
        { id: 4, name: "Robert Johnson", department: "HR", efficiency: 45, productivity: 50, quality: 40, avatarColor: "#E81123" },
      ];
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/team-efficiency/trends", timeRange],
    queryFn: async () => {
      // This would be a real API call in a production environment
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      return weeks.map(week => ({
        name: week,
        efficiency: Math.floor(Math.random() * 20) + 70,
        productivity: Math.floor(Math.random() * 20) + 65,
        quality: Math.floor(Math.random() * 20) + 75,
      }));
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-warning";
    return "text-danger";
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return "bg-accent/10 text-accent";
    if (score >= 60) return "bg-warning/10 text-warning";
    return "bg-danger/10 text-danger";
  };

  const getEfficiencyIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-accent" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <TrendingDown className="h-4 w-4 text-danger" />;
  };

  // Calculate team averages
  const teamAverages = teamData?.reduce(
    (acc, member) => {
      acc.efficiency += member.efficiency;
      acc.productivity += member.productivity;
      acc.quality += member.quality;
      return acc;
    },
    { efficiency: 0, productivity: 0, quality: 0 }
  );

  const teamSize = teamData?.length || 1;
  const avgEfficiency = teamAverages ? (teamAverages.efficiency / teamSize).toFixed(1) : "0";
  const avgProductivity = teamAverages ? (teamAverages.productivity / teamSize).toFixed(1) : "0";
  const avgQuality = teamAverages ? (teamAverages.quality / teamSize).toFixed(1) : "0";

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Team Efficiency</h1>
          <p className="text-neutral-medium">Analyze team performance and identify improvement areas</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neutral-medium text-sm font-medium">Team Efficiency</h3>
              <div className={getEfficiencyColor(Number(avgEfficiency))}>
                {getEfficiencyIcon(Number(avgEfficiency))}
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-neutral-dark">{avgEfficiency}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-light/50 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  Number(avgEfficiency) >= 80 ? 'bg-accent' : 
                  Number(avgEfficiency) >= 60 ? 'bg-warning' : 'bg-danger'
                }`} 
                style={{ width: `${avgEfficiency}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neutral-medium text-sm font-medium">Team Productivity</h3>
              <div className={getEfficiencyColor(Number(avgProductivity))}>
                {getEfficiencyIcon(Number(avgProductivity))}
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-neutral-dark">{avgProductivity}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-light/50 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  Number(avgProductivity) >= 80 ? 'bg-accent' : 
                  Number(avgProductivity) >= 60 ? 'bg-warning' : 'bg-danger'
                }`} 
                style={{ width: `${avgProductivity}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neutral-medium text-sm font-medium">Work Quality</h3>
              <div className={getEfficiencyColor(Number(avgQuality))}>
                {getEfficiencyIcon(Number(avgQuality))}
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-neutral-dark">{avgQuality}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-light/50 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  Number(avgQuality) >= 80 ? 'bg-accent' : 
                  Number(avgQuality) >= 60 ? 'bg-warning' : 'bg-danger'
                }`} 
                style={{ width: `${avgQuality}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Efficiency Trends</TabsTrigger>
          <TabsTrigger value="comparison">Team Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle className="text-lg">Team Members Efficiency</CardTitle>
                <div className="mt-2 md:mt-0">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-light">
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Team Member</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Department</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Efficiency</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Productivity</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Quality</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          Loading team data...
                        </td>
                      </tr>
                    ) : teamData?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          No team members found
                        </td>
                      </tr>
                    ) : (
                      teamData?.filter(member => 
                        departmentFilter === "all" || 
                        member.department.toLowerCase() === departmentFilter
                      ).map((member) => (
                        <tr key={member.id} className="border-b border-neutral-light hover:bg-neutral-light/20">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2" style={{ backgroundColor: `${member.avatarColor}20`, color: member.avatarColor }}>
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              <div>{member.name}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{member.department}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                                <div 
                                  className={`h-full rounded-full ${
                                    member.efficiency >= 80 ? 'bg-accent' : 
                                    member.efficiency >= 60 ? 'bg-warning' : 'bg-danger'
                                  }`} 
                                  style={{ width: `${member.efficiency}%` }}
                                />
                              </div>
                              <span>{member.efficiency}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                                <div 
                                  className={`h-full rounded-full ${
                                    member.productivity >= 80 ? 'bg-accent' : 
                                    member.productivity >= 60 ? 'bg-warning' : 'bg-danger'
                                  }`} 
                                  style={{ width: `${member.productivity}%` }}
                                />
                              </div>
                              <span>{member.productivity}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                                <div 
                                  className={`h-full rounded-full ${
                                    member.quality >= 80 ? 'bg-accent' : 
                                    member.quality >= 60 ? 'bg-warning' : 'bg-danger'
                                  }`} 
                                  style={{ width: `${member.quality}%` }}
                                />
                              </div>
                              <span>{member.quality}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${getEfficiencyBadge(member.efficiency)}`}>
                              {member.efficiency >= 80 ? 'Excellent' : 
                               member.efficiency >= 60 ? 'Average' : 'Needs Improvement'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efficiency by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Development", efficiency: 85, productivity: 90, quality: 80 },
                        { name: "Marketing", efficiency: 68, productivity: 65, quality: 72 },
                        { name: "Sales", efficiency: 92, productivity: 95, quality: 88 },
                        { name: "HR", efficiency: 45, productivity: 50, quality: 40 },
                        { name: "Design", efficiency: 78, productivity: 75, quality: 82 },
                      ]}
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
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="efficiency" name="Efficiency" fill="#0078D4" />
                      <Bar dataKey="productivity" name="Productivity" fill="#107C10" />
                      <Bar dataKey="quality" name="Quality" fill="#FFB900" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      cx="50%" 
                      cy="50%" 
                      outerRadius="80%" 
                      data={[
                        { subject: 'Efficiency', Development: 85, Marketing: 68, Sales: 92, HR: 45, fullMark: 100 },
                        { subject: 'Productivity', Development: 90, Marketing: 65, Sales: 95, HR: 50, fullMark: 100 },
                        { subject: 'Quality', Development: 80, Marketing: 72, Sales: 88, HR: 40, fullMark: 100 },
                        { subject: 'Communication', Development: 70, Marketing: 85, Sales: 75, HR: 90, fullMark: 100 },
                        { subject: 'Teamwork', Development: 75, Marketing: 80, Sales: 60, HR: 85, fullMark: 100 },
                      ]}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Development" dataKey="Development" stroke="#0078D4" fill="#0078D4" fillOpacity={0.2} />
                      <Radar name="Marketing" dataKey="Marketing" stroke="#2B88D8" fill="#2B88D8" fillOpacity={0.2} />
                      <Radar name="Sales" dataKey="Sales" stroke="#107C10" fill="#107C10" fillOpacity={0.2} />
                      <Radar name="HR" dataKey="HR" stroke="#E81123" fill="#E81123" fillOpacity={0.2} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Efficiency Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
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
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="efficiency" 
                        name="Efficiency"
                        stroke="#0078D4" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="productivity" 
                        name="Productivity"
                        stroke="#107C10" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quality" 
                        name="Quality"
                        stroke="#FFB900" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Communication</h3>
                      <span className="text-primary font-medium">+15%</span>
                    </div>
                    <p className="text-sm text-neutral-medium">Improved team communication has led to faster project completion and reduced misunderstandings.</p>
                  </div>
                  
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/10">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Meeting Efficiency</h3>
                      <span className="text-warning font-medium">+8%</span>
                    </div>
                    <p className="text-sm text-neutral-medium">Shorter, more focused meetings have improved overall team productivity, but there's still room for improvement.</p>
                  </div>
                  
                  <div className="p-4 bg-danger/5 rounded-lg border border-danger/10">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Task Handovers</h3>
                      <span className="text-danger font-medium">-5%</span>
                    </div>
                    <p className="text-sm text-neutral-medium">Task handovers between departments are still causing delays and require better documented processes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Productivity vs. Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                      }}
                    >
                      <CartesianGrid />
                      <XAxis type="number" dataKey="productivity" name="Productivity" domain={[0, 100]} label={{ value: 'Productivity (%)', position: 'bottom' }} />
                      <YAxis type="number" dataKey="quality" name="Quality" domain={[0, 100]} label={{ value: 'Quality (%)', angle: -90, position: 'insideLeft' }} />
                      <ZAxis type="number" range={[100, 500]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => [`${value}%`, ""]} />
                      <Legend />
                      <Scatter name="Development" data={[
                        { productivity: 90, quality: 80, efficiency: 85, z: 85 },
                      ]} fill="#0078D4" />
                      <Scatter name="Marketing" data={[
                        { productivity: 65, quality: 72, efficiency: 68, z: 68 },
                      ]} fill="#2B88D8" />
                      <Scatter name="Sales" data={[
                        { productivity: 95, quality: 88, efficiency: 92, z: 92 },
                      ]} fill="#107C10" />
                      <Scatter name="HR" data={[
                        { productivity: 50, quality: 40, efficiency: 45, z: 45 },
                      ]} fill="#E81123" />
                      <Scatter name="Design" data={[
                        { productivity: 75, quality: 82, efficiency: 78, z: 78 },
                      ]} fill="#FFB900" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-light">
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Department</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Avg. Efficiency</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Trend</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Strengths</th>
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Areas to Improve</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">Development</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-accent rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span>85%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-accent">
                          <TrendingUp className="h-4 w-4 mr-1" /> +5%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Technical quality</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Problem solving</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                            <span className="text-xs">Documentation</span>
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                            <span className="text-xs">Meeting efficiency</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">Marketing</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-warning rounded-full" style={{ width: '68%' }}></div>
                          </div>
                          <span>68%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-warning">
                          <TrendingUp className="h-4 w-4 mr-1" /> +2%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Creativity</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Communication</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                            <span className="text-xs">Deadlines</span>
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                            <span className="text-xs">Task prioritization</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">Sales</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-accent rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span>92%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-accent">
                          <TrendingUp className="h-4 w-4 mr-1" /> +8%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Client relations</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Target achievement</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                            <span className="text-xs">Product knowledge</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">HR</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-danger rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span>45%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-danger">
                          <TrendingDown className="h-4 w-4 mr-1" /> -3%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-accent mr-1" />
                            <span className="text-xs">Policy adherence</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-danger mr-1" />
                            <span className="text-xs">Response times</span>
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-danger mr-1" />
                            <span className="text-xs">Process efficiency</span>
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 text-danger mr-1" />
                            <span className="text-xs">Resource allocation</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efficiency by Project Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Product Development", efficiency: 88 },
                        { name: "Marketing Campaigns", efficiency: 75 },
                        { name: "Client Projects", efficiency: 92 },
                        { name: "Internal Initiatives", efficiency: 62 },
                        { name: "Maintenance", efficiency: 78 },
                      ]}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip formatter={(value) => [`${value}%`, "Efficiency"]} />
                      <Bar 
                        dataKey="efficiency" 
                        fill="#0078D4"
                        radius={[0, 4, 4, 0]}
                      >
                        {[
                          { name: "Product Development", efficiency: 88 },
                          { name: "Marketing Campaigns", efficiency: 75 },
                          { name: "Client Projects", efficiency: 92 },
                          { name: "Internal Initiatives", efficiency: 62 },
                          { name: "Maintenance", efficiency: 78 },
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.efficiency >= 80 ? '#107C10' :
                              entry.efficiency >= 60 ? '#FFB900' :
                              '#E81123'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h3 className="font-medium mb-2">Process Optimization</h3>
                    <p className="text-sm text-neutral-medium">
                      Streamline HR processes by implementing automated workflows and reducing approval steps. This could improve HR efficiency by an estimated 25%.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                    <h3 className="font-medium mb-2">Cross-department Collaboration</h3>
                    <p className="text-sm text-neutral-medium">
                      Establish regular sync meetings between Marketing and Development to improve handover processes and reduce delays in campaign implementations.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/10">
                    <h3 className="font-medium mb-2">Knowledge Sharing</h3>
                    <p className="text-sm text-neutral-medium">
                      Create a structured program to share Sales team's best practices with other departments to improve overall team efficiency.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
