import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

interface TimelineData {
  time: string;
  productive: number;
  neutral: number;
  unproductive: number;
}

export default function ActivityTimelineChart() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  
  // Fetch data based on time range
  const { data, isLoading } = useQuery({
    queryKey: ["/api/activities/timeline", timeRange],
    queryFn: () => {
      // This would be a real API call in a production environment
      // For now, we generate mock data that matches the selected time range
      let mockData: TimelineData[] = [];
      
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

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-dark">Activity Timeline</h3>
          <div className="flex space-x-2">
            <Button 
              variant={timeRange === "day" ? "default" : "outline"} 
              size="sm"
              className="text-xs h-7"
              onClick={() => setTimeRange("day")}
            >
              Day
            </Button>
            <Button 
              variant={timeRange === "week" ? "default" : "outline"} 
              size="sm"
              className="text-xs h-7"
              onClick={() => setTimeRange("week")}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "default" : "outline"} 
              size="sm"
              className="text-xs h-7"
              onClick={() => setTimeRange("month")}
            >
              Month
            </Button>
          </div>
        </div>
        
        <div className="h-[240px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading activity data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, ""]} />
                <Line
                  type="monotone"
                  dataKey="productive"
                  stroke="#107C10"
                  strokeWidth={2}
                  dot={{ fill: "#107C10", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  stroke="#FFB900"
                  strokeWidth={2}
                  dot={{ fill: "#FFB900", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="unproductive"
                  stroke="#E81123"
                  strokeWidth={2}
                  dot={{ fill: "#E81123", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="flex justify-center space-x-4 mt-4 text-xs">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-accent mr-1"></span>
            <span>Productive</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-warning mr-1"></span>
            <span>Neutral</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-danger mr-1"></span>
            <span>Unproductive</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
