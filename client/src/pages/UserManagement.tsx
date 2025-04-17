import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  Settings2, 
  Trash2, 
  Check, 
  X, 
  UserPlus 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTeam } from "@/hooks/useTeam";

// User form schema
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  role: z.enum(["user", "manager", "admin"]),
  avatarColor: z.string().optional(),
  is_agent: z.boolean().default(false),
});

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();
  const { getUsers, deleteUser } = useTeam();
  
  // Get users with useQuery
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: getUsers
  });

  // Add user form
  const addUserForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      department: "",
      role: "user",
      avatarColor: getRandomColor(),
    },
  });

  // Edit user form
  const editUserForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      department: "",
      role: "user",
      avatarColor: "",
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (userData: z.infer<typeof userFormSchema>) => {
      return apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      toast({
        title: "User added",
        description: "The user has been added successfully.",
      });
      setIsAddUserOpen(false);
      addUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: (userData: z.infer<typeof userFormSchema> & { id: number }) => {
      return apiRequest("PUT", `/api/users/${userData.id}`, userData);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      setIsEditUserOpen(false);
      editUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => {
      return deleteUser(userId);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle add user form submission
  const onAddUserSubmit = (values: z.infer<typeof userFormSchema>) => {
    addUserMutation.mutate(values);
  };

  // Handle edit user form submission
  const onEditUserSubmit = (values: z.infer<typeof userFormSchema>) => {
    if (selectedUser) {
      editUserMutation.mutate({ ...values, id: selectedUser.id });
    }
  };

  // Open the edit user dialog
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    editUserForm.reset({
      username: user.username,
      password: "", // We don't display the current password
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      avatarColor: user.avatarColor,
    });
    setIsEditUserOpen(true);
  };

  // Confirm user deletion
  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  // Generate a random color for new users
  function getRandomColor() {
    const colors = ["#0078D4", "#2B88D8", "#107C10", "#FFB900", "#E81123"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark">User Management</h1>
          <p className="text-neutral-medium">Manage users and permissions</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account for ActivTrack.
                </DialogDescription>
              </DialogHeader>
              <Form {...addUserForm}>
                <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={addUserForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addUserForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Development">Development</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="Design">Design</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={addUserForm.control}
                    name="is_agent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Agent Account</FormLabel>
                          <FormDescription>
                            Enable this to create an agent account for desktop monitoring
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
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addUserMutation.isPending}>
                      {addUserMutation.isPending ? "Adding..." : "Add User"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>User Accounts</CardTitle>
                <div className="relative mt-2 md:mt-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-8 md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2" style={{ backgroundColor: `${user.avatarColor}20`, color: user.avatarColor }}>
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-neutral-medium">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              user.role === 'admin' 
                                ? 'bg-primary/10 text-primary' 
                                : user.role === 'manager'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-neutral-light text-neutral-medium'
                            }`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              user.status === 'active' 
                                ? 'bg-accent/10 text-accent' 
                                : user.status === 'away'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditUser(user)}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.role === 'admin'} // Prevent deleting admin users
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information and permissions.
                </DialogDescription>
              </DialogHeader>
              <Form {...editUserForm}>
                <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Leave blank to keep current" />
                          </FormControl>
                          <FormDescription>
                            Leave blank to keep current password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editUserForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Development">Development</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="Design">Design</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editUserForm.control}
                    name="is_agent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Agent Account</FormLabel>
                          <FormDescription>
                            Enable this to make this user an agent account
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
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editUserMutation.isPending}>
                      {editUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Agent Management</CardTitle>
                <div className="relative mt-2 md:mt-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search agents..."
                    className="pl-8 md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading agents...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.filter(user => user.is_agent).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No agents found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers
                        .filter(user => user.is_agent)
                        .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2" style={{ backgroundColor: `${user.avatarColor}20`, color: user.avatarColor }}>
                                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-xs text-neutral-medium">@{user.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.device_id || 'Not registered'}</TableCell>
                            <TableCell>{user.last_seen ? new Date(user.last_seen).toLocaleString() : 'Never'}</TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                user.status === 'active' 
                                  ? 'bg-accent/10 text-accent' 
                                  : user.status === 'away'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-danger/10 text-danger'
                              }`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams Management</CardTitle>
              <CardDescription>
                Create and manage teams for better organization and permissions control.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Current Teams</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Development Team</CardTitle>
                    <CardDescription>Core product development team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex -space-x-2 mb-4">
                      <Avatar className="border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: "#0078D420", color: "#0078D4" }}>AK</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: "#2B88D820", color: "#2B88D8" }}>JM</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: "#10F81120", color: "#107C10" }}>SL</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback className="bg-neutral-light">+2</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Marketing Team</CardTitle>
                    <CardDescription>Handles all marketing initiatives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex -space-x-2 mb-4">
                      <Avatar className="border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: "#2B88D820", color: "#2B88D8" }}>JM</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: "#E8112320", color: "#E81123" }}>RJ</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback className="bg-neutral-light">+1</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Sales Team</CardTitle>
                    <CardDescription>Client acquisition and sales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex -space-x-2 mb-4">
                      <Avatar className="border-2 border-background">
                        <AvatarFallback style={{ backgroundColor: "#FFB90020", color: "#FFB900" }}>SL</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarFallback className="bg-neutral-light">+2</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Settings</CardTitle>
              <CardDescription>
                Define what each role can access and modify in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-light">
                      <th className="py-3 px-4 text-left font-medium text-neutral-medium">Permission</th>
                      <th className="py-3 px-4 text-center font-medium text-neutral-medium">Admin</th>
                      <th className="py-3 px-4 text-center font-medium text-neutral-medium">Manager</th>
                      <th className="py-3 px-4 text-center font-medium text-neutral-medium">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">View Dashboard</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">View Team Overview</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">View Own Activity</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">View Team Activity</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">Manage Users</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">Manage Settings</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">Export Data</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-neutral-light">
                      <td className="py-3 px-4 font-medium">View Reports</td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-accent mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-danger mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <Label className="mb-2 block">Custom Permissions</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">User can see their own stats only</h4>
                      <p className="text-sm text-neutral-medium">Users can only view their own activity data</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Managers can edit team reports</h4>
                      <p className="text-sm text-neutral-medium">Allow managers to modify and customize team reports</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Users can set their productivity goals</h4>
                      <p className="text-sm text-neutral-medium">Allow users to set their own productivity targets</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button>Save Permission Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
