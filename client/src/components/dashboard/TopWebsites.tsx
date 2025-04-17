import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Globe, FileText, Video, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface Website {
  url: string;
  time: number;
  timeFormatted: string;
  percentage: number;
  icon: string;
  iconColor: string;
}

export default function TopWebsites() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/websites/top"],
    queryFn: () => {
      // This would fetch from the API in a production environment
      // For now, we're returning sample data
      return [
        { 
          url: "github.com", 
          time: 5100, 
          timeFormatted: "1h 25m", 
          percentage: 75, 
          icon: "globe", 
          iconColor: "#0078D4" 
        },
        { 
          url: "docs.google.com", 
          time: 3300, 
          timeFormatted: "55m", 
          percentage: 40, 
          icon: "file-text", 
          iconColor: "#2B88D8" 
        },
        { 
          url: "youtube.com", 
          time: 2700, 
          timeFormatted: "45m", 
          percentage: 30, 
          icon: "video", 
          iconColor: "#FFB900" 
        },
        { 
          url: "slack.com", 
          time: 2100, 
          timeFormatted: "35m", 
          percentage: 25, 
          icon: "message-square", 
          iconColor: "#E81123" 
        }
      ];
    },
  });

  // Helper function to render the appropriate icon
  const renderIcon = (iconName: string, color: string) => {
    const props = { size: 16, className: `text-${color}` };
    
    switch (iconName) {
      case "globe":
        return <Globe {...props} />;
      case "file-text":
        return <FileText {...props} />;
      case "video":
        return <Video {...props} />;
      case "message-square":
        return <MessageSquare {...props} />;
      default:
        return <Globe {...props} />;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-dark">Top Websites</h3>
          <Button variant="ghost" size="icon" className="text-neutral-medium hover:text-primary">
            <MoreVertical size={16} />
          </Button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center">
              <p>Loading website data...</p>
            </div>
          ) : (
            <>
              {data?.map((website, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center mr-3"
                    style={{ 
                      backgroundColor: `${website.iconColor}10`, 
                      color: website.iconColor 
                    }}
                  >
                    {renderIcon(website.icon, website.iconColor)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-neutral-dark">{website.url}</div>
                      <div className="text-sm text-neutral-medium">{website.timeFormatted}</div>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-light/50 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${website.percentage}%`,
                          backgroundColor: website.percentage >= 60 ? '#107C10' : '#0078D4'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="ghost" className="w-full text-center text-primary text-sm mt-2">
                View All Websites
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
