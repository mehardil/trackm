import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity as ActivityIcon, Clock, Users, TrendingUp, Laptop, Settings, Trash2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Activity {
  id: string;
  application: string;
  title: string;
  start_time: string;
  duration: number;
  category: string;
  metrics?: {
    cpu: number;
    memory: number;
  };
  user_id: string;
  team_id: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
}

interface Agent {
  id: string;
  hostname: string;
  username: string;
  os_type: string;
  status: string;
  last_seen: string;
  user_id: string;
  team_id: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [timeRange, setTimeRange] = useState("today");

  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      return data.teams || [];
    }
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activity", selectedTeam, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTeam !== "all") params.append("team_id", selectedTeam);
      if (timeRange) params.append("time_range", timeRange);
      
      const response = await fetch(`/api/activity?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      return data.activities || [];
    }
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    queryFn: async () => {
      const response = await fetch("/api/agents");
      if (!response.ok) throw new Error("Failed to fetch agents");
      const data = await response.json();
      return data.agents || [];
    }
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return data.users || [];
    }
  });

  const getProductivityIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "productive":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "unproductive":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getProductivityColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "productive":
        return "bg-green-100 text-green-800";
      case "unproductive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getUserName = (userId: string) => {
    return users?.find(user => user.id === userId)?.name || 'Unknown User';
  };

  const getTeamName = (teamId: string) => {
    return teams?.find(team => team.id === teamId)?.name || 'Unknown Team';
  };

  const activeAgents = agents?.filter(agent => agent.status === 'active') || [];
  const totalActivities = activities?.length || 0;
  const productiveActivities = activities?.filter(activity => activity.category?.toLowerCase() === 'productive').length || 0;
  const productivityScore = totalActivities > 0 ? Math.round((productiveActivities / totalActivities) * 100) : 0;
  const totalActiveTime = activities?.reduce((acc, activity) => acc + activity.duration, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Dashboard</h1>
          <p className="text-neutral-medium">Monitor team performance and activity</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{activeAgents.length}</span>
                <span className="text-sm text-neutral-medium ml-2">agents</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{totalActivities}</span>
                <span className="text-sm text-neutral-medium ml-2">activities</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{productivityScore}%</span>
                <span className="text-sm text-neutral-medium ml-2">productive</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">
                  {Math.round(totalActiveTime / 60)}
                </span>
                <span className="text-sm text-neutral-medium ml-2">minutes</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <p className="text-neutral-medium text-center py-8">Loading activities...</p>
                ) : activities?.length === 0 ? (
                  <p className="text-neutral-medium text-center py-8">No activities found</p>
                ) : (
                  <div className="space-y-4">
                    {activities?.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {activity.application.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.application}</p>
                          <p className="text-sm text-neutral-medium">{activity.title}</p>
                          <p className="text-xs text-neutral-medium">
                            {getUserName(activity.user_id)} • {getTeamName(activity.team_id)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getProductivityColor(activity.category)}`}>
                            {activity.category}
                          </span>
                          {getProductivityIcon(activity.category)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{format(new Date(activity.start_time), 'h:mm a')}</p>
                          <p className="text-xs text-neutral-medium">
                            {activity.duration > 0 ? `${Math.round(activity.duration / 60)} minutes` : 'Active'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAgents ? (
                  <p className="text-neutral-medium text-center py-8">Loading agents...</p>
                ) : activeAgents.length === 0 ? (
                  <p className="text-neutral-medium text-center py-8">No active agents found</p>
                ) : (
                  <div className="space-y-4">
                    {activeAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Laptop className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{agent.hostname}</p>
                          <p className="text-sm text-neutral-medium">{agent.username}</p>
                          <p className="text-xs text-neutral-medium">
                            {getUserName(agent.user_id)} • {getTeamName(agent.team_id)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{agent.os_type}</p>
                          <p className="text-xs text-neutral-medium">
                            Last seen: {format(new Date(agent.last_seen), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
      </div>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <p className="text-neutral-medium text-center py-8">Loading activities...</p>
              ) : activities?.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No activities found</p>
              ) : (
                <div className="space-y-4">
                  {activities?.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {activity.application.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.application}</p>
                        <p className="text-sm text-neutral-medium">{activity.title}</p>
                        <p className="text-xs text-neutral-medium">
                          {getUserName(activity.user_id)} • {getTeamName(activity.team_id)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getProductivityColor(activity.category)}`}>
                          {activity.category}
                        </span>
                        {getProductivityIcon(activity.category)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(new Date(activity.start_time), 'h:mm a')}</p>
                        <p className="text-xs text-neutral-medium">
                          {activity.duration > 0 ? `${Math.round(activity.duration / 60)} minutes` : 'Active'}
                        </p>
                      </div>
                    </div>
                  ))}
      </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAgents ? (
                <p className="text-neutral-medium text-center py-8">Loading agents...</p>
              ) : agents?.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No agents found</p>
              ) : (
                <div className="space-y-4">
                  {agents?.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Laptop className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{agent.hostname}</p>
                        <p className="text-sm text-neutral-medium">{agent.username}</p>
                        <p className="text-xs text-neutral-medium">
                          {getUserName(agent.user_id)} • {getTeamName(agent.team_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{agent.os_type}</p>
                        <p className="text-xs text-neutral-medium">
                          Last seen: {format(new Date(agent.last_seen), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
      </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
