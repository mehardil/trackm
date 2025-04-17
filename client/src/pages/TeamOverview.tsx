import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, TrendingUp, Clock, Activity, Plus, Settings, Trash2 } from "lucide-react";

export default function TeamOverview() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [timeRange, setTimeRange] = useState("today");

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    }
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activity", selectedTeam, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTeam !== "all") params.append("team_id", selectedTeam);
      if (timeRange) params.append("time_range", timeRange);
      
      const response = await fetch(`/api/activity?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    }
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Team Overview</h1>
          <p className="text-neutral-medium">Monitor team performance and activity</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team: any) => (
                <SelectItem key={team.id} value={team.id.toString()}>
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
          
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Team
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">
                  {users?.filter((user: any) => user.team_id === parseInt(selectedTeam)).length}
                </span>
                <span className="text-sm text-neutral-medium ml-2">members</span>
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
                <span className="text-3xl font-bold">
                  {activities?.length ? Math.round(
                    (activities.filter((a: any) => a.category === 'productive').length / activities.length) * 100
                  ) : 0}%
                </span>
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
                  {activities?.length ? Math.round(
                    activities.reduce((acc: number, a: any) => acc + a.duration, 0) / 60
                  ) : 0}
                </span>
                <span className="text-sm text-neutral-medium ml-2">minutes</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{activities?.length}</span>
                <span className="text-sm text-neutral-medium ml-2">activities</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <p className="text-neutral-medium text-center py-8">Loading members...</p>
                ) : users?.length === 0 ? (
                  <p className="text-neutral-medium text-center py-8">No members found</p>
                ) : (
                  <div className="space-y-4">
                    {users?.filter((user: any) => user.team_id === parseInt(selectedTeam)).map((user: any) => (
                      <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-neutral-medium">{user.email}</p>
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
                    {activities?.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {activity.application.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.application}</p>
                          <p className="text-sm text-neutral-medium">{activity.title}</p>
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
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <p className="text-neutral-medium text-center py-8">Loading members...</p>
              ) : users?.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No members found</p>
              ) : (
                <div className="space-y-4">
                  {users?.filter((user: any) => user.team_id === parseInt(selectedTeam)).map((user: any) => (
                    <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-neutral-medium">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{user.role}</p>
                        <p className="text-xs text-neutral-medium">
                          Joined: {format(new Date(user.created_at), 'MMM d, yyyy')}
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
        
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <p className="text-neutral-medium text-center py-8">Loading activities...</p>
              ) : activities?.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No activities found</p>
              ) : (
                <div className="space-y-4">
                  {activities?.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {activity.application.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.application}</p>
                        <p className="text-sm text-neutral-medium">{activity.title}</p>
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
      </Tabs>
    </div>
  );
}
