import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Activity, ActivitySummary } from "@/lib/types";

export function useActivity() {
  const { toast } = useToast();

  // Get recent activities
  const getRecentActivities = (limit = 10) => {
    return useQuery({
      queryKey: ["/api/activities", limit],
      queryFn: async () => {
        const response = await fetch(`/api/activities?limit=${limit}`);
        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }
        return response.json();
      },
    });
  };

  // Get user activities
  const getUserActivities = (userId: number, startDate?: Date, endDate?: Date) => {
    const queryParams = new URLSearchParams();
    if (startDate) {
      queryParams.append("startDate", startDate.toISOString());
    }
    if (endDate) {
      queryParams.append("endDate", endDate.toISOString());
    }

    return useQuery({
      queryKey: ["/api/users", userId, "activities", startDate?.toISOString(), endDate?.toISOString()],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}/activities?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user activities");
        }
        return response.json();
      },
    });
  };

  // Get activity categories distribution
  const getActivityCategories = (userId?: number, startDate?: Date, endDate?: Date) => {
    const queryParams = new URLSearchParams();
    if (userId) {
      queryParams.append("userId", userId.toString());
    }
    if (startDate) {
      queryParams.append("startDate", startDate.toISOString());
    }
    if (endDate) {
      queryParams.append("endDate", endDate.toISOString());
    }

    return useQuery({
      queryKey: ["/api/activities/categories", userId, startDate?.toISOString(), endDate?.toISOString()],
      queryFn: async () => {
        // In a real app, you would fetch from the API
        // For now, we're returning mock data
        return [
          { name: "Productive", value: 65, color: "#107C10" },
          { name: "Neutral", value: 25, color: "#FFB900" },
          { name: "Unproductive", value: 10, color: "#E81123" }
        ];
      },
    });
  };

  // Create activity
  const createActivity = () => {
    return useMutation({
      mutationFn: (activityData: Omit<Activity, "id">) => {
        return apiRequest("POST", "/api/activities", activityData);
      },
      onSuccess: () => {
        toast({
          title: "Activity created",
          description: "The activity has been recorded successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to record activity. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Get activity timeline
  const getActivityTimeline = (timeRange: "day" | "week" | "month", userId?: number) => {
    const queryParams = new URLSearchParams();
    queryParams.append("timeRange", timeRange);
    if (userId) {
      queryParams.append("userId", userId.toString());
    }

    return useQuery({
      queryKey: ["/api/activities/timeline", timeRange, userId],
      queryFn: async () => {
        // In a real app, you would fetch from the API
        // This would generate mock data that matches the selected time range
        let mockData: any[] = [];
        
        if (timeRange === "day") {
          // Hourly data for a day
          for (let i = 0; i < 24; i += 2) {
            const hour = i < 10 ? `0${i}:00` : `${i}:00`;
            mockData.push({
              time: hour,
              productive: Math.floor(Math.random() * 55) + 15, // 15-70
              neutral: Math.floor(Math.random() * 25) + 5,    // 5-30
              unproductive: Math.floor(Math.random() * 15),   // 0-15
            });
          }
        } else if (timeRange === "week") {
          // Daily data for a week
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          mockData = days.map(day => ({
            time: day,
            productive: Math.floor(Math.random() * 55) + 15,
            neutral: Math.floor(Math.random() * 25) + 5,
            unproductive: Math.floor(Math.random() * 15),
          }));
        } else if (timeRange === "month") {
          // Weekly data for a month
          for (let i = 1; i <= 4; i++) {
            mockData.push({
              time: `Week ${i}`,
              productive: Math.floor(Math.random() * 55) + 15,
              neutral: Math.floor(Math.random() * 25) + 5,
              unproductive: Math.floor(Math.random() * 15),
            });
          }
        }
        
        return mockData;
      },
    });
  };

  // Get daily summary for a user
  const getUserDailySummary = (userId: number, date = new Date()) => {
    return useQuery({
      queryKey: ["/api/users", userId, "summary", date.toISOString()],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}/summary?date=${date.toISOString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user summary");
        }
        return response.json();
      },
    });
  };

  // Export activity data
  const exportActivity = async (params: {
    startDate: Date;
    endDate: Date;
    userIds: number[];
    format: string;
    includeInactive?: boolean;
  }) => {
    try {
      const response = await apiRequest(
        "POST", 
        "/api/export/activity", 
        params
      );
      
      if (!response.ok) {
        throw new Error("Failed to export activity data");
      }
      
      // In a real app, this would handle the file download
      return response;
    } catch (error) {
      throw new Error("Failed to export activity data");
    }
  };

  return {
    getRecentActivities,
    getUserActivities,
    getActivityCategories,
    createActivity,
    getActivityTimeline,
    getUserDailySummary,
    exportActivity
  };
}
