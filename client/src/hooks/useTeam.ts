import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, TeamMember } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useTeam() {
  const { toast } = useToast();

  // Get all users
  const getUsers = async (): Promise<User[]> => {
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  };

  // Get user by ID
  const getUserById = (userId: number) => {
    return useQuery({
      queryKey: ["/api/users", userId],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        return response.json();
      },
      enabled: !!userId,
    });
  };

  // Create user mutation
  const createUser = () => {
    return useMutation({
      mutationFn: (userData: Omit<User, "id" | "status">) => {
        return apiRequest("POST", "/api/users", userData);
      },
      onSuccess: () => {
        toast({
          title: "User created",
          description: "The user has been created successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create user. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Update user mutation
  const updateUser = () => {
    return useMutation({
      mutationFn: ({ id, ...userData }: User) => {
        return apiRequest("PUT", `/api/users/${id}`, userData);
      },
      onSuccess: () => {
        toast({
          title: "User updated",
          description: "The user has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update user. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Delete user
  const deleteUser = async (userId: number): Promise<void> => {
    try {
      const response = await apiRequest("DELETE", `/api/users/${userId}`, null);
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update user status
  const updateUserStatus = () => {
    return useMutation({
      mutationFn: ({ userId, status }: { userId: number; status: string }) => {
        return apiRequest("PUT", `/api/users/${userId}/status`, { status });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-overview"] });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update user status. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Get team overview
  const getTeamOverview = () => {
    return useQuery({
      queryKey: ["/api/dashboard/team-overview"],
      queryFn: async (): Promise<TeamMember[]> => {
        const response = await fetch("/api/dashboard/team-overview");
        if (!response.ok) {
          throw new Error("Failed to fetch team overview");
        }
        return response.json();
      },
    });
  };

  // Get team productivity by department
  const getTeamProductivityByDepartment = () => {
    return useQuery({
      queryKey: ["/api/team/productivity-by-department"],
      queryFn: async () => {
        // In a production app, this would be a real API call
        // For now, we're returning mock data
        return [
          { name: "Development", productivity: 85 },
          { name: "Sales", productivity: 92 },
          { name: "Marketing", productivity: 68 },
          { name: "HR", productivity: 45 },
          { name: "Design", productivity: 73 },
        ];
      },
    });
  };

  // Get department breakdown
  const getDepartmentBreakdown = () => {
    return useQuery({
      queryKey: ["/api/team/department-breakdown"],
      queryFn: async () => {
        // In a production app, this would be a real API call
        // For now, we're returning mock data
        return [
          { name: "Development", value: 6, color: "#0078D4" },
          { name: "Marketing", value: 4, color: "#2B88D8" },
          { name: "Sales", value: 3, color: "#107C10" },
          { name: "HR", value: 2, color: "#FFB900" },
          { name: "Design", value: 2, color: "#E81123" },
        ];
      },
    });
  };

  return {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    getTeamOverview,
    getTeamProductivityByDepartment,
    getDepartmentBreakdown,
  };
}
