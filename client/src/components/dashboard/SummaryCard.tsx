import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: number;
  changeLabel?: string;
}

export default function SummaryCard({ 
  title, 
  value, 
  icon, 
  change = 0,
  changeLabel = "vs previous period" 
}: SummaryCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-neutral-medium text-sm font-medium">{title}</h3>
          <div className="text-primary">{icon}</div>
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-semibold text-neutral-dark">{value}</span>
          {!isNeutral && (
            <span className={`ml-2 text-xs ${isPositive ? 'text-accent' : 'text-danger'} flex items-center`}>
              {isPositive ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
              <span>{Math.abs(change)}%</span>
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-medium mt-1">{changeLabel}</div>
      </CardContent>
    </Card>
  );
}
