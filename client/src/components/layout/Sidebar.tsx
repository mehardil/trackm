import { Link, useRoute } from "wouter";
import { 
  LayoutDashboard, Users, ChartBarStacked, Laptop, Globe, 
  GitBranch, Clock, Watch, Settings, Shield, Download, 
  MonitorDown
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  const [isActive] = useRoute(href);
  
  return (
    <Link href={href} className={`flex items-center py-2 px-4 text-sm ${
      isActive 
        ? 'bg-primary/10 text-primary border-l-3 border-primary' 
        : 'text-neutral-dark hover:bg-gray-100'
    }`}>
      <span className="w-5 flex items-center">{icon}</span>
      <span className="ml-2">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar bg-white w-64 border-r border-neutral-light flex-shrink-0 hidden md:block overflow-y-auto">
      <nav className="py-4">
        <div className="mb-2 px-4 text-neutral-medium text-xs font-semibold uppercase tracking-wider">
          Main
        </div>
        <NavItem href="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
        <NavItem href="/team-overview" icon={<Users size={16} />} label="Team Overview" />
        <NavItem href="/activity" icon={<ChartBarStacked size={16} />} label="Activity" />
        <NavItem href="/applications" icon={<Laptop size={16} />} label="Applications" />
        <NavItem href="/websites" icon={<Globe size={16} />} label="Websites" />
        
        <div className="mb-2 mt-6 px-4 text-neutral-medium text-xs font-semibold uppercase tracking-wider">
          Analysis
        </div>
        <NavItem href="/productivity" icon={<GitBranch size={16} />} label="Productivity" />
        <NavItem href="/work-hours" icon={<Clock size={16} />} label="Work Hours" />
        <NavItem href="/team-efficiency" icon={<Watch size={16} />} label="Team Efficiency" />
        
        <div className="mb-2 mt-6 px-4 text-neutral-medium text-xs font-semibold uppercase tracking-wider">
          Admin
        </div>
        <NavItem href="/settings" icon={<Settings size={16} />} label="Settings" />
        <NavItem href="/user-management" icon={<Shield size={16} />} label="User Management" />
        <NavItem href="/export-data" icon={<Download size={16} />} label="Export Data" />
        <NavItem href="/agent-download" icon={<MonitorDown size={16} />} label="Agent Download" />
      </nav>
    </aside>
  );
}
