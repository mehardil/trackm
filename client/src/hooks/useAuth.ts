import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// User type definition
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
  isLoading: true,
  isAuthenticated: false,
});

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Function to create and handle auth state without JSX
function createAuthProvider() {
  // Context accessor
  const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };
  
  // Provider component
  const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { toast } = useToast();
  
    // Check for existing session on initial load
    useEffect(() => {
      const checkAuth = async () => {
        try {
          // For demo purposes, we'll use a mock user
          // In a real app, you would check for a valid session with the backend
          const mockUser: User = {
            id: 5,
            username: "admin",
            name: "Admin User",
            email: "admin@example.com",
            role: "admin"
          };
          
          setUser(mockUser);
        } catch (error) {
          console.error("Auth check failed:", error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      };
  
      checkAuth();
    }, []);
  
    // Login function
    const login = async (username: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        // In a real app, you would make a request to your authentication endpoint
        const response = await apiRequest("POST", "/api/auth/login", { username, password });
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          return true;
        } else {
          toast({
            title: "Login failed",
            description: "Invalid username or password",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        console.error("Login error:", error);
        toast({
          title: "Login failed",
          description: "An error occurred during login",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    };
  
    // Logout function
    const logout = async (): Promise<void> => {
      setIsLoading(true);
      try {
        if (user) {
          // In a real app, you would make a request to your logout endpoint
          await apiRequest("POST", "/api/auth/logout", { userId: user.id });
        }
        setUser(null);
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        });
      } catch (error) {
        console.error("Logout error:", error);
        toast({
          title: "Logout failed",
          description: "An error occurred during logout",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    const value = {
      user,
      login,
      logout,
      isLoading,
      isAuthenticated: !!user
    };
    
    // Using non-JSX syntax
    return React.createElement(
      AuthContext.Provider,
      { value },
      children
    );
  };
  
  return { AuthProvider, useAuth };
}

// Export the provider and hook
const { AuthProvider, useAuth } = createAuthProvider();
export { AuthProvider, useAuth };
