import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

interface ApplicationUsage {
  name: string;
  time: number;
  timeFormatted: string;
  color: string;
}

export default function ApplicationUsageChart() {
  const [displayMode, setDisplayMode] = useState<"top10" | "all">("top10");
  
  const { data, isLoading } = useQuery({
    queryKey: ["/api/applications/usage", displayMode],
    queryFn: () => {
      // This would fetch from the API in a production environment
      // For now, we're returning sample data
      const colors = [
        "#0078D4", // primary
        "#2B88D8", // secondary
        "#107C10", // accent
        "#FFB900", // warning
        "#E81123", // danger
        "#5C2D91", // purple
        "#008575", // teal
        "#D83B01", // orange
        "#B4009E", // magenta
        "#767676", // gray
      ];
      
      const applications: ApplicationUsage[] = [
        { name: "Microsoft Teams", time: 135, timeFormatted: "2h 15m", color: colors[0] },
        { name: "Visual Studio Code", time: 108, timeFormatted: "1h 48m", color: colors[1] },
        { name: "Outlook", time: 55, timeFormatted: "55m", color: colors[2] },
        { name: "Google Chrome", time: 90, timeFormatted: "1h 30m", color: colors[3] },
        { name: "Slack", time: 45, timeFormatted: "45m", color: colors[4] },
        { name: "PowerPoint", time: 35, timeFormatted: "35m", color: colors[5] },
        { name: "Excel", time: 30, timeFormatted: "30m", color: colors[6] },
        { name: "Zoom", time: 25, timeFormatted: "25m", color: colors[7] },
        { name: "Photoshop", time: 20, timeFormatted: "20m", color: colors[8] },
        { name: "Word", time: 15, timeFormatted: "15m", color: colors[9] },
      ];
      
      // Sort by time descending
      applications.sort((a, b) => b.time - a.time);
      
      // Limit to top 10 if needed
      return displayMode === "top10" ? applications.slice(0, 10) : applications;
    },
  });
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-dark">Application Usage</h3>
          <Select
            value={displayMode}
            onValueChange={(value) => setDisplayMode(value as "top10" | "all")}
          >
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top10">Top 10</SelectItem>
              <SelectItem value="all">All Applications</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-[240px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading application data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => [formatTime(Number(value)), "Time spent"]}
                  labelStyle={{ color: "#323130" }}
                />
                <Bar 
                  dataKey="time" 
                  background={{ fill: "#f5f5f5" }}
                  radius={[0, 4, 4, 0]}
                >
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data?.slice(0, 4).map((app, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: app.color }}
              ></div>
              <span className="truncate">{app.name}</span>
              <span className="ml-auto font-medium">{app.timeFormatted}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
