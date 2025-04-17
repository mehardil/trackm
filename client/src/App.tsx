import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import TeamOverview from "@/pages/TeamOverview";
import Activity from "@/pages/Activity";
import Applications from "@/pages/Applications";
import Websites from "@/pages/Websites";
import Productivity from "@/pages/Productivity";
import WorkHours from "@/pages/WorkHours";
import TeamEfficiency from "@/pages/TeamEfficiency";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/UserManagement";
import ExportData from "@/pages/ExportData";
import AgentDownload from "@/pages/AgentDownload";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/hooks/useAuth";

function Router() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/team-overview" component={TeamOverview} />
            <Route path="/activity" component={Activity} />
            <Route path="/applications" component={Applications} />
            <Route path="/websites" component={Websites} />
            <Route path="/productivity" component={Productivity} />
            <Route path="/work-hours" component={WorkHours} />
            <Route path="/team-efficiency" component={TeamEfficiency} />
            <Route path="/settings" component={Settings} />
            <Route path="/user-management" component={UserManagement} />
            <Route path="/export-data" component={ExportData} />
            <Route path="/agent-download" component={AgentDownload} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
      <MobileSidebar />
    </div>
  );
}

function App() {
  const [isMounted, setIsMounted] = useState(false);

  // Simulate login (in real app, would use authentication)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
