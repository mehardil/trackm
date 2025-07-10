import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Activity as ActivityIcon, 
  Clock, 
  Users, 
  TrendingUp, 
  Laptop, 
  Calendar, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Ban,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  Monitor,
  Smartphone,
  Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

interface Agent {
  id: string;
  name: string;
  email: string;
  status: string;
  last_active: string;
  is_online: boolean;
  device_type: string;
  current_activity?: {
    application: string;
    title: string;
    duration: number;
  };
}

interface DashboardMetrics {
  total_active_time: number;
  productive_time: number;
  neutral_time: number;
  unproductive_time: number;
  active_users: number;
  total_users: number;
  productivity_score: number;
  applications_used: number;
  websites_visited: number;
}

interface RecentActivity {
  id: number;
  user_name: string;
  application: string;
  title: string;
  duration: number;
  timestamp: string;
  category: string;
}

interface TopApplication {
  name: string;
  usage_time: number;
  category: string;
  sessions: number;
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [timeRange, setTimeRange] = useState("today");
  const [wsConnected, setWsConnected] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgents, setActiveAgents] = useState<Agent[]>([]);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for real-time agent status only
  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket('ws://127.0.0.1:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected for agent status');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle agent status updates
          if (data.type === 'agent_status' || data.event === 'agent_connected') {
            setAgents(prev => {
              const updatedAgents = [...prev];
              const agentIndex = updatedAgents.findIndex(a => a.id === data.data.userId || a.id === data.data.device_id);
              
              if (agentIndex !== -1) {
                updatedAgents[agentIndex] = {
                  ...updatedAgents[agentIndex],
                  status: data.data.status || 'active',
                  last_active: new Date().toISOString(),
                  is_online: true
                };
              } else {
                // New agent connected
                updatedAgents.push({
                  id: data.data.userId || data.data.device_id,
                  name: data.data.username || `Agent-${data.data.userId}`,
                  email: data.data.email || `agent-${data.data.userId}@example.com`,
                  status: 'active',
                  last_active: new Date().toISOString(),
                  is_online: true,
                  device_type: data.data.os_type || 'unknown'
                });
              }
              return updatedAgents;
            });
          }
          
          // Handle current activity updates
          if (data.type === 'activity' || data.event === 'activity_update') {
            setAgents(prev => {
              const updatedAgents = [...prev];
              const agentIndex = updatedAgents.findIndex(a => a.id === data.data.userId);
              
              if (agentIndex !== -1) {
                updatedAgents[agentIndex] = {
                  ...updatedAgents[agentIndex],
                  current_activity: {
                    application: data.data.application,
                    title: data.data.title,
                    duration: data.data.duration || 0
                  },
                  last_active: new Date().toISOString(),
                  is_online: true
                };
              }
              return updatedAgents;
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        setWsConnected(false);
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

  // Fetch dashboard metrics from database
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', timeRange, selectedTeam, selectedUser],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange) params.append('time_range', timeRange);
      if (selectedTeam && selectedTeam !== 'all') params.append('team_id', selectedTeam);
      if (selectedUser && selectedUser !== 'all') params.append('user_id', selectedUser);

      const response = await fetch(`http://127.0.0.1:8000/api/dashboard/metrics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      return await response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch agents from database
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:8000/api/agents');
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const data = await response.json();
      return data.agents || [];
    },
    onSuccess: (data) => {
      setAgents(data);
      setActiveAgents(data.filter(agent => agent.is_online));
    }
  });

  // Fetch recent activities from database
  const { data: recentActivities, isLoading: isLoadingActivities } = useQuery<RecentActivity[]>({
    queryKey: ['recent-activities', timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange) params.append('time_range', timeRange);
      params.append('limit', '10');

      const response = await fetch(`http://127.0.0.1:8000/api/activities/recent?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities');
      }
      
      return await response.json();
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch top applications from database
  const { data: topApplications, isLoading: isLoadingApps } = useQuery<TopApplication[]>({
    queryKey: ['top-applications', timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange) params.append('time_range', timeRange);
      params.append('limit', '5');

      const response = await fetch(`http://127.0.0.1:8000/api/applications/top?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch top applications');
      }
      
      return await response.json();
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProductivityColor = (category: string) => {
    switch (category) {
      case 'productive': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'unproductive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProductivityIcon = (category: string) => {
    switch (category) {
      case 'productive': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'neutral': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'unproductive': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'windows': return <Monitor className="w-4 h-4" />;
      case 'linux': return <Laptop className="w-4 h-4" />;
      case 'macos': return <Monitor className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (isLoadingMetrics || isLoadingAgents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time productivity insights and team activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={wsConnected ? "default" : "secondary"}>
            {wsConnected ? "Live" : "Offline"}
          </Badge>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
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

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatDuration(metrics.total_active_time) : '0m'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.productivity_score}%` : '0%'}
            </div>
            <Progress value={metrics?.productivity_score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAgents.length} / {agents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Used</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.applications_used || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Active Agents */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Active Agents</span>
              <Badge variant="outline">{activeAgents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No agents currently active
              </p>
            ) : (
              activeAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(agent.device_type)}
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.current_activity ? (
                          <>
                            {agent.current_activity.application} - {agent.current_activity.title}
                          </>
                        ) : (
                          'Idle'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {agent.current_activity ? formatDuration(agent.current_activity.duration) : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ActivityIcon className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getProductivityIcon(activity.category)}
                    <div>
                      <p className="text-sm font-medium">{activity.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.application} - {activity.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{formatDuration(activity.duration)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activities
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Applications */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Laptop className="h-5 w-5" />
              <span>Top Applications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topApplications && topApplications.length > 0 ? (
              topApplications.map((app, index) => (
                <div key={app.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDuration(app.usage_time)}</p>
                    <Badge variant="outline" className="text-xs">
                      {app.category}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No application data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Breakdown */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Productivity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">Productive</span>
                  <span className="text-sm font-medium">{formatDuration(metrics.productive_time)}</span>
                </div>
                <Progress value={(metrics.productive_time / metrics.total_active_time) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-600">Neutral</span>
                  <span className="text-sm font-medium">{formatDuration(metrics.neutral_time)}</span>
                </div>
                <Progress value={(metrics.neutral_time / metrics.total_active_time) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">Unproductive</span>
                  <span className="text-sm font-medium">{formatDuration(metrics.unproductive_time)}</span>
                </div>
                <Progress value={(metrics.unproductive_time / metrics.total_active_time) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
