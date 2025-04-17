import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Save, RefreshCw, Shield, Bell, Clock, UserCog, Database } from "lucide-react";

const generalFormSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  adminEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  workdayStart: z.string(),
  workdayEnd: z.string(),
  timezone: z.string(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  dailyReports: z.boolean(),
  weeklyReports: z.boolean(),
  anomalyAlerts: z.boolean(),
  lowProductivityAlerts: z.boolean(),
});

const privacyFormSchema = z.object({
  trackScreenshots: z.boolean(),
  trackWebsites: z.boolean(),
  trackApplications: z.boolean(),
  anonymizeReports: z.boolean(),
  dataRetentionPeriod: z.string(),
});

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  // General Settings Form
  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      companyName: "ActivTrack Demo",
      adminEmail: "admin@example.com",
      workdayStart: "09:00",
      workdayEnd: "17:00",
      timezone: "UTC",
    },
  });

  // Notification Settings Form
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      dailyReports: false,
      weeklyReports: true,
      anomalyAlerts: true,
      lowProductivityAlerts: false,
    },
  });

  // Privacy Settings Form
  const privacyForm = useForm<z.infer<typeof privacyFormSchema>>({
    resolver: zodResolver(privacyFormSchema),
    defaultValues: {
      trackScreenshots: false,
      trackWebsites: true,
      trackApplications: true,
      anonymizeReports: false,
      dataRetentionPeriod: "90",
    },
  });

  // Submit handlers
  const onSubmitGeneral = async (values: z.infer<typeof generalFormSchema>) => {
    try {
      await apiRequest("PUT", "/api/settings/general", values);
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your general settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitNotifications = async (values: z.infer<typeof notificationFormSchema>) => {
    try {
      await apiRequest("PUT", "/api/settings/notifications", values);
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your notification settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmitPrivacy = async (values: z.infer<typeof privacyFormSchema>) => {
    try {
      await apiRequest("PUT", "/api/settings/privacy", values);
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your privacy settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">Settings</h1>
          <p className="text-neutral-medium">Configure your ActivTrack application settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 h-auto">
          <TabsTrigger value="general" className="flex items-center py-2">
            <UserCog className="h-4 w-4 mr-2" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center py-2">
            <Bell className="h-4 w-4 mr-2" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center py-2">
            <Shield className="h-4 w-4 mr-2" />
            <span>Privacy & Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic settings for your ActivTrack application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This name will appear on all reports and dashboards.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Administrator Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormDescription>
                          System notifications will be sent to this email address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={generalForm.control}
                      name="workdayStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workday Start Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="workdayEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workday End Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generalForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="Europe/London">GMT</SelectItem>
                            <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          All time-based reports will use this timezone by default.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => generalForm.reset()}
                    >
                      Reset
                    </Button>
                    <Button type="submit" className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Data Synchronization</CardTitle>
              <CardDescription>
                Control how often data is synchronized with connected systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-sync Frequency</h4>
                    <p className="text-sm text-neutral-medium">How often data is automatically synchronized</p>
                  </div>
                  <Select defaultValue="15">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Manual Sync</h4>
                    <p className="text-sm text-neutral-medium">Synchronize data manually right now</p>
                  </div>
                  <Button variant="outline" className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Last Sync</h4>
                    <p className="text-sm text-neutral-medium">Last successful synchronization</p>
                  </div>
                  <span className="text-sm">Today, 14:32</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure what notifications you and your team receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Email Notifications</FormLabel>
                          <FormDescription>
                            Receive system notifications via email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="dailyReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Daily Reports</FormLabel>
                          <FormDescription>
                            Receive daily activity summary reports
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="weeklyReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Weekly Reports</FormLabel>
                          <FormDescription>
                            Receive weekly productivity summary reports
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="anomalyAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Anomaly Detection Alerts</FormLabel>
                          <FormDescription>
                            Get notified when unusual activity patterns are detected
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="lowProductivityAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Low Productivity Alerts</FormLabel>
                          <FormDescription>
                            Get notified when team members show lower than normal productivity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => notificationForm.reset()}
                    >
                      Reset
                    </Button>
                    <Button type="submit" className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure when alerts are triggered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="productivity-threshold">Low Productivity Threshold</Label>
                    <div className="flex items-center mt-2 space-x-2">
                      <Input id="productivity-threshold" type="number" min="0" max="100" defaultValue="50" />
                      <span>%</span>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">
                      Alert when productivity falls below this percentage
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="idle-threshold">Idle Time Threshold</Label>
                    <div className="flex items-center mt-2 space-x-2">
                      <Input id="idle-threshold" type="number" min="0" max="180" defaultValue="30" />
                      <span>minutes</span>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">
                      Alert when idle time exceeds this duration
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="after-hours-threshold">After Hours Threshold</Label>
                    <div className="flex items-center mt-2 space-x-2">
                      <Input id="after-hours-threshold" type="number" min="0" max="24" defaultValue="2" />
                      <span>hours</span>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">
                      Alert when work exceeds this duration beyond work hours
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="unproductive-threshold">Unproductive Apps Threshold</Label>
                    <div className="flex items-center mt-2 space-x-2">
                      <Input id="unproductive-threshold" type="number" min="0" max="100" defaultValue="25" />
                      <span>%</span>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">
                      Alert when unproductive app usage exceeds this percentage
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Thresholds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Configure what data is collected and how it's processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...privacyForm}>
                <form onSubmit={privacyForm.handleSubmit(onSubmitPrivacy)} className="space-y-6">
                  <FormField
                    control={privacyForm.control}
                    name="trackScreenshots"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Track Screenshots</FormLabel>
                          <FormDescription>
                            Periodically capture screenshots during work hours
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={privacyForm.control}
                    name="trackWebsites"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Track Websites</FormLabel>
                          <FormDescription>
                            Monitor websites visited during work hours
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={privacyForm.control}
                    name="trackApplications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Track Applications</FormLabel>
                          <FormDescription>
                            Monitor applications used during work hours
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={privacyForm.control}
                    name="anonymizeReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Anonymize Reports</FormLabel>
                          <FormDescription>
                            Hide personal information in generated reports
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={privacyForm.control}
                    name="dataRetentionPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Retention Period (days)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select retention period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Data older than this will be automatically deleted
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => privacyForm.reset()}
                    >
                      Reset
                    </Button>
                    <Button type="submit" className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage collected data and export options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-warning/5 rounded-lg p-4 border border-warning/10">
                  <h3 className="font-medium mb-2">Data Export</h3>
                  <p className="text-sm text-neutral-medium mb-4">
                    Export all collected data in various formats for backup or analysis purposes.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">Export as CSV</Button>
                    <Button variant="outline" size="sm">Export as Excel</Button>
                    <Button variant="outline" size="sm">Export as JSON</Button>
                  </div>
                </div>

                <div className="bg-danger/5 rounded-lg p-4 border border-danger/10">
                  <h3 className="font-medium mb-2">Data Deletion</h3>
                  <p className="text-sm text-neutral-medium mb-4">
                    Permanently delete data based on specific criteria. This action cannot be undone.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="destructive" size="sm">Delete Inactive Users</Button>
                    <Button variant="destructive" size="sm">Delete Historical Data</Button>
                  </div>
                </div>

                <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                  <h3 className="font-medium mb-2">Privacy Compliance</h3>
                  <p className="text-sm text-neutral-medium mb-4">
                    Tools to help maintain compliance with privacy regulations.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">Generate Privacy Report</Button>
                    <Button variant="outline" size="sm">Data Access Log</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
