import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/activities/timeline", timeRange],
    queryFn: async () => {
      try {
        console.log('Fetching timeline data for range:', timeRange);
        const response = await fetch(`http://localhost:8000/api/activities/timeline?timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch timeline data');
        }
        const data = await response.json();
        console.log('Fetched timeline data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        throw error;
      }
    }
  });

  // Debug effect to log data changes
  useEffect(() => {
    console.log('Timeline data updated:', data);
    console.log('Loading state:', isLoading);
    console.log('Error state:', error);
  }, [data, isLoading, error]);

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
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-red-500">Error loading data</p>
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
