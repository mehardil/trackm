import { Link, useRoute } from "wouter";
import { LayoutDashboard, Users, ChartBarStacked, Settings, MonitorDown } from "lucide-react";

interface MobileNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function MobileNavItem({ href, icon, label }: MobileNavItemProps) {
  const [isActive] = useRoute(href);
  
  return (
    <Link href={href} className={`flex flex-col items-center justify-center flex-1 ${
      isActive ? 'text-primary' : 'text-neutral-dark'
    }`}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}

export default function MobileSidebar() {
  return (
    <div className="bg-white border-t border-neutral-light fixed bottom-0 left-0 right-0 h-16 flex md:hidden z-50">
      <MobileNavItem 
        href="/" 
        icon={<LayoutDashboard size={16} />} 
        label="Dashboard" 
      />
      <MobileNavItem 
        href="/team-overview" 
        icon={<Users size={16} />} 
        label="Team" 
      />
      <MobileNavItem 
        href="/activity" 
        icon={<ChartBarStacked size={16} />} 
        label="Activity" 
      />
      <MobileNavItem 
        href="/agent-download" 
        icon={<MonitorDown size={16} />} 
        label="Agents" 
      />
      <MobileNavItem 
        href="/settings" 
        icon={<Settings size={16} />} 
        label="Settings" 
      />
    </div>
  );
}
