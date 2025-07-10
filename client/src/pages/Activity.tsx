import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity as ActivityIcon, Clock, Users, TrendingUp, Laptop, Calendar, Filter, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Activity {
  id: number;
  user_id: number;
  team_id: number | null;
  start_time: string;
  end_time: string;
  duration: number;
  application: string;
  title: string;
  category: string;
  is_active: boolean;
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

export default function Activity() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [timeRange, setTimeRange] = useState("today");
  const [productivityFilter, setProductivityFilter] = useState("all");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket('ws://localhost:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'activity') {
            setActivities(prev => {
              const newActivity = data.data;
              // Check if activity already exists
              const exists = prev.some(a => a.id === newActivity.id);
              if (!exists) {
                return [newActivity, ...prev];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        setWsConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setWsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch initial data
  const { data: initialData, isLoading: isLoadingInitial } = useQuery<Activity[]>({
    queryKey: ['activities', selectedTeam, selectedUser, timeRange, productivityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTeam && selectedTeam !== 'all') params.append('team_id', selectedTeam);
      if (selectedUser && selectedUser !== 'all') params.append('user_id', selectedUser);
      if (timeRange) params.append('time_range', timeRange);
      if (productivityFilter && productivityFilter !== 'all') params.append('productivity', productivityFilter);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/activity?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      return data.activities || [];
    }
  } as UseQueryOptions<Activity[], Error>);

  // Update activities state when data changes
  useEffect(() => {
    if (initialData) {
      setActivities(initialData);
    }
  }, [initialData]);

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return data.users || [];
    }
  });

  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      return data.teams || [];
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

  const categoryBreakdown = activities?.reduce((acc, activity) => {
    const category = activity.category?.toLowerCase() || 'neutral';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate metrics
  const totalActivities = activities.length;
  const productiveTime = activities.reduce((acc: number, activity: Activity) => {
    return acc + (activity.category?.toLowerCase() === 'productive' ? activity.duration : 0);
  }, 0);
  const activeTime = activities.reduce((acc: number, activity: Activity) => acc + activity.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Activity</h1>
          <p className="text-neutral-medium">Monitor and analyze user activity</p>
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
          
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
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

          <Select value={productivityFilter} onValueChange={setProductivityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Productivity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="productive">Productive</SelectItem>
              <SelectItem value="unproductive">Unproductive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{activities.length}</span>
                <span className="text-sm text-neutral-medium ml-2">activities</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productive Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">
                  {Math.round((categoryBreakdown['productive'] || 0) / activities.length * 100)}%
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
            {activities.length === 0 ? (
              <p className="text-neutral-medium">Loading...</p>
            ) : (
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">
                  {Math.round(activities.reduce((acc, activity) => acc + activity.duration, 0) / 60 || 0)}
                </span>
                <span className="text-sm text-neutral-medium ml-2">minutes</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No activities found</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
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
                        <p className="text-sm">
                          {activity.start_time ? new Date(activity.start_time).toLocaleTimeString() : 'N/A'}
                        </p>
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
        
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity List</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No activities found</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-time">
                        {new Date(activity.start_time).toLocaleString()}
                      </div>
                      <div className="activity-details">
                        <div className="activity-application">{activity.application}</div>
                        <div className="activity-title">{activity.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-neutral-medium text-center py-8">No categories found</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getProductivityColor(category)}`}>
                          {category}
                        </span>
                        {getProductivityIcon(category)}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(count / activities.length) * 100}%`,
                              backgroundColor: category === 'productive' ? '#10B981' : category === 'unproductive' ? '#EF4444' : '#F59E0B'
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{count}</p>
                        <p className="text-xs text-neutral-medium">
                          {Math.round((count / activities.length) * 100)}%
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
