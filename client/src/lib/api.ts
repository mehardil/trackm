import { queryClient } from "./queryClient";
import { ActivityCategory, ActivityTimelineData, DashboardMetrics } from "./types";

/**
 * API Utility Functions
 * This file contains functions for making API requests to the backend
 */

// Base API URL
const API_BASE_URL = "/api";

// Get dashboard metrics
export async function getDashboardMetrics(timeRange: string = "last7days"): Promise<DashboardMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/metrics?timeRange=${timeRange}`);
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard metrics");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    throw error;
  }
}

// Get team overview
export async function getTeamOverview() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/team-overview`);
    if (!response.ok) {
      throw new Error("Failed to fetch team overview");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching team overview:", error);
    throw error;
  }
}

// Get activity categories distribution
export async function getActivityCategories(): Promise<ActivityCategory[]> {
  try {
    // In a real application, this would be an API call
    // For now, we're returning sample data
    return [
      { name: "Productive", value: 65, color: "#107C10" },
      { name: "Neutral", value: 25, color: "#FFB900" },
      { name: "Unproductive", value: 10, color: "#E81123" }
    ];
  } catch (error) {
    console.error("Error fetching activity categories:", error);
    throw error;
  }
}

// Get application usage
export async function getApplicationUsage(displayMode: string = "top10") {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/usage?displayMode=${displayMode}`);
    if (!response.ok) {
      throw new Error("Failed to fetch application usage");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching application usage:", error);
    throw error;
  }
}

// Get top websites
export async function getTopWebsites() {
  try {
    const response = await fetch(`${API_BASE_URL}/websites/top`);
    if (!response.ok) {
      throw new Error("Failed to fetch top websites");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching top websites:", error);
    throw error;
  }
}

// Get recent activities
export async function getRecentActivities() {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/recent`);
    if (!response.ok) {
      throw new Error("Failed to fetch recent activities");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
}

// Get activity timeline data
export async function getActivityTimeline(timeRange: "day" | "week" | "month"): Promise<ActivityTimelineData[]> {
  try {
    // This would be a real API call in a production environment
    // For now, we generate mock data that matches the selected time range
    let data: ActivityTimelineData[] = [];
    
    if (timeRange === "day") {
      // Hourly data for a day
      for (let i = 0; i < 24; i += 2) {
        const hour = i < 10 ? `0${i}:00` : `${i}:00`;
        data.push({
          time: hour,
          productive: Math.floor(Math.random() * 55) + 15, // 15-70
          neutral: Math.floor(Math.random() * 25) + 5,    // 5-30
          unproductive: Math.floor(Math.random() * 15),   // 0-15
        });
      }
    } else if (timeRange === "week") {
      // Daily data for a week
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      data = days.map(day => ({
        time: day,
        productive: Math.floor(Math.random() * 55) + 15,
        neutral: Math.floor(Math.random() * 25) + 5,
        unproductive: Math.floor(Math.random() * 15),
      }));
    } else if (timeRange === "month") {
      // Weekly data for a month
      for (let i = 1; i <= 4; i++) {
        data.push({
          time: `Week ${i}`,
          productive: Math.floor(Math.random() * 55) + 15,
          neutral: Math.floor(Math.random() * 25) + 5,
          unproductive: Math.floor(Math.random() * 15),
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching activity timeline:", error);
    throw error;
  }
}

// Login user
export async function loginUser(username: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to login");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

// Logout user
export async function logoutUser(userId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to logout");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

// Get all users
export async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

// Update user status
export async function updateUserStatus(userId: number, status: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to update user status");
    }

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-overview"] });

    return await response.json();
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

// Export activity data
export async function exportActivityData(params: {
  startDate: Date;
  endDate: Date;
  userIds: number[];
  format: string;
  includeInactive?: boolean;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/export/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to export activity data");
    }

    return response;
  } catch (error) {
    console.error("Error exporting activity data:", error);
    throw error;
  }
}
