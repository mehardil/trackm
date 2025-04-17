import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface RecentActivityItem {
  userId: number;
  userName: string;
  userInitials: string;
  avatarColor: string;
  action: string;
  application: string;
  timestamp: string;
  timeAgo: string;
}

export default function RecentActivity() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/activities/recent"],
    queryFn: async () => {
      // This would fetch from the API in a production environment
      // For now, we're returning sample data
      return [
        {
          userId: 1,
          userName: "Amy Kirkland",
          userInitials: "AK",
          avatarColor: "#0078D4",
          action: "Started working on",
          application: "Project X",
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          timeAgo: "10 minutes ago"
        },
        {
          userId: 2,
          userName: "John Miller",
          userInitials: "JM",
          avatarColor: "#2B88D8",
          action: "Edited presentation in",
          application: "PowerPoint",
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          timeAgo: "25 minutes ago"
        },
        {
          userId: 3,
          userName: "Sarah Lee",
          userInitials: "SL",
          avatarColor: "#FFB900",
          action: "Updated client records in",
          application: "Salesforce",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          timeAgo: "45 minutes ago"
        },
        {
          userId: 4,
          userName: "Robert Johnson",
          userInitials: "RJ",
          avatarColor: "#E81123",
          action: "Reviewing applications on",
          application: "Workday",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          timeAgo: "1 hour ago"
        }
      ];
    },
  });

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-dark">Recent Activity</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-medium hover:text-primary"
            onClick={() => refetch()}
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center">
              <p>Loading recent activity...</p>
            </div>
          ) : (
            <>
              {data?.map((activity, index) => (
                <div key={index} className="flex">
                  <div className="mr-3 relative">
                    <Avatar 
                      className="h-8 w-8"
                      style={{ 
                        backgroundColor: `${activity.avatarColor}20`, 
                        color: activity.avatarColor 
                      }}
                    >
                      <AvatarFallback>{activity.userInitials}</AvatarFallback>
                    </Avatar>
                    {index < data.length - 1 && (
                      <div className="absolute top-6 bottom-0 left-4 w-px bg-neutral-light"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-dark">{activity.userName}</div>
                    <div className="text-sm text-neutral-medium">
                      {activity.action} <span className="text-primary">{activity.application}</span>
                    </div>
                    <div className="text-xs text-neutral-medium mt-1">{activity.timeAgo}</div>
                  </div>
                </div>
              ))}
              
              <Button variant="ghost" className="w-full text-center text-primary text-sm mt-2">
                View All Activity
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
