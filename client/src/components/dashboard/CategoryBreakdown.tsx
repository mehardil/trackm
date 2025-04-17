import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export default function CategoryBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/activities/categories"],
    queryFn: () => {
      // This would fetch from the API in a production environment
      // For now, we're returning sample data
      return [
        { name: "Productive", value: 65, color: "#107C10" },
        { name: "Neutral", value: 25, color: "#FFB900" },
        { name: "Unproductive", value: 10, color: "#E81123" }
      ];
    },
  });

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-dark">Activity Categories</h3>
          <Button variant="ghost" size="icon" className="text-neutral-medium hover:text-primary">
            <MoreVertical size={16} />
          </Button>
        </div>
        
        <div className="h-48">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading category data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, ""]}
                  itemStyle={{ color: "#333" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-2 mt-4">
          {data?.map((category, index) => (
            <div key={index} className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
              <span>{category.name}</span>
              <span className="ml-auto font-medium">{category.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
