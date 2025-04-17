import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { FaPython, FaWindows, FaApple, FaLinux, FaDownload, FaCheck } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

export default function AgentDownload() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const organizationId = user ? (user as any).organizationId : undefined;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let url = `/api/agent/download/python`;
      if (organizationId) url += `/${organizationId}`;
      
      // Create a download link for the file
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.setAttribute('download', 'ActivTrack_Agent.exe');
      downloadLink.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download Started",
        description: "Agent download has started. Run the executable file after downloading.",
        variant: "default",
      });
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading the agent. Please try again.",
        variant: "destructive",
      });
      console.error("Download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Desktop Agent Download</h1>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FaDownload className="mr-2 h-6 w-6" /> ActivTrack Agent
            </CardTitle>
            <CardDescription>
              Cross-platform monitoring agent for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Features</h3>
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> App Usage Tracking</li>
                  <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Website Monitoring</li>
                  <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Idle Detection</li>
                  <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Screenshot Capture</li>
                  <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Policy Enforcement</li>
                  <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Real-time Updates</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">System Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium flex items-center"><FaWindows className="mr-2" /> Windows</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>Windows 7/8/10/11 (32/64-bit)</li>
                      <li>512MB RAM</li>
                      <li>50MB disk space</li>
                      <li>Admin privileges for installation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center"><FaApple className="mr-2" /> macOS</h4>
                    <ul className="text-sm text-muted-foreground">
                      <li>macOS 10.12 or later</li>
                      <li>512MB RAM</li>
                      <li>50MB disk space</li>
                      <li>Admin privileges for installation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleDownload} 
              disabled={downloading}
              className="w-full"
            >
              {downloading ? 'Downloading...' : 'Download Agent'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Installation Instructions</h2>
          <Card>
            <CardHeader>
            <CardTitle>Installation Steps</CardTitle>
            </CardHeader>
            <CardContent>
            <ol className="list-decimal pl-5 space-y-4">
              <li>Download the agent executable file</li>
              <li>
                <strong>Windows Installation:</strong>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Right-click the downloaded file and select "Run as administrator"</li>
                  <li>If Windows SmartScreen appears, click "More info" and then "Run anyway"</li>
                  <li>The installer will automatically configure everything</li>
                </ul>
              </li>
              <li>
                <strong>macOS Installation:</strong>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Open the downloaded package</li>
                  <li>Follow the installation wizard</li>
                  <li>Grant necessary permissions when prompted</li>
                </ul>
              </li>
              <li>
                <strong>The agent will automatically:</strong>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Register with your organization</li>
                  <li>Configure itself to start with the system</li>
                  <li>Begin monitoring in the background</li>
                  <li>Connect to the server for real-time updates</li>
                </ul>
              </li>
              <li>
                <strong>Verification:</strong>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Check Task Manager (Windows) or Activity Monitor (macOS)</li>
                  <li>Look for "ActivTrack Agent" in the processes list</li>
                  <li>The agent icon will appear in the system tray/menu bar</li>
                </ul>
              </li>
              </ol>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}