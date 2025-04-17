import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Settings2,
  Globe,
  Monitor,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Restriction form schema
const restrictionFormSchema = {
  name: "",
  type: "application", // or "website"
  pattern: "",
  action: "block", // or "allow"
  description: "",
};

export default function Restrictions() {
  const [activeTab, setActiveTab] = useState("applications");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState(null);
  const [newRestriction, setNewRestriction] = useState(restrictionFormSchema);
  const { toast } = useToast();

  // Fetch restrictions
  const { data: restrictions, isLoading } = useQuery({
    queryKey: ["/api/restrictions"],
    queryFn: () => apiRequest("GET", "/api/restrictions")
  });

  // Add restriction mutation
  const addRestrictionMutation = useMutation({
    mutationFn: (restriction) => apiRequest("POST", "/api/restrictions", restriction),
    onSuccess: () => {
      toast({
        title: "Restriction added",
        description: "The restriction has been added successfully.",
      });
      setIsAddOpen(false);
      setNewRestriction(restrictionFormSchema);
      queryClient.invalidateQueries({ queryKey: ["/api/restrictions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add restriction. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete restriction mutation
  const deleteRestrictionMutation = useMutation({
    mutationFn: (id) => apiRequest("DELETE", `/api/restrictions/${id}`),
    onSuccess: () => {
      toast({
        title: "Restriction deleted",
        description: "The restriction has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restrictions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete restriction. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle add restriction
  const handleAddRestriction = () => {
    addRestrictionMutation.mutate(newRestriction);
  };

  // Handle delete restriction
  const handleDeleteRestriction = (id) => {
    if (window.confirm("Are you sure you want to delete this restriction?")) {
      deleteRestrictionMutation.mutate(id);
    }
  };

  // Handle edit restriction
  const handleEditRestriction = (restriction) => {
    setSelectedRestriction(restriction);
    setIsEditOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Restrictions</h1>
          <p className="text-muted-foreground">
            Manage application and website restrictions
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Restriction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Restriction</DialogTitle>
              <DialogDescription>
                Create a new application or website restriction
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newRestriction.type}
                  onValueChange={(value) => setNewRestriction({ ...newRestriction, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newRestriction.name}
                  onChange={(e) => setNewRestriction({ ...newRestriction, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input
                  id="pattern"
                  value={newRestriction.pattern}
                  onChange={(e) => setNewRestriction({ ...newRestriction, pattern: e.target.value })}
                  placeholder={newRestriction.type === "application" ? "e.g. chrome.exe" : "e.g. facebook.com"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={newRestriction.action}
                  onValueChange={(value) => setNewRestriction({ ...newRestriction, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="allow">Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRestriction.description}
                  onChange={(e) => setNewRestriction({ ...newRestriction, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRestriction}>
                Add Restriction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="applications" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applications">
            <Monitor className="h-4 w-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="websites">
            <Globe className="h-4 w-4 mr-2" />
            Websites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Restrictions</CardTitle>
              <CardDescription>
                Manage application access and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading restrictions...
                      </TableCell>
                    </TableRow>
                  ) : restrictions?.filter(r => r.type === "application").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No application restrictions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    restrictions
                      .filter(r => r.type === "application")
                      .map((restriction) => (
                        <TableRow key={restriction.id}>
                          <TableCell>{restriction.name}</TableCell>
                          <TableCell>{restriction.pattern}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              restriction.action === "block" 
                                ? "bg-red-100 text-red-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {restriction.action.charAt(0).toUpperCase() + restriction.action.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{restriction.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditRestriction(restriction)}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteRestriction(restriction.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Restrictions</CardTitle>
              <CardDescription>
                Manage website access and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading restrictions...
                      </TableCell>
                    </TableRow>
                  ) : restrictions?.filter(r => r.type === "website").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No website restrictions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    restrictions
                      .filter(r => r.type === "website")
                      .map((restriction) => (
                        <TableRow key={restriction.id}>
                          <TableCell>{restriction.name}</TableCell>
                          <TableCell>{restriction.pattern}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              restriction.action === "block" 
                                ? "bg-red-100 text-red-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {restriction.action.charAt(0).toUpperCase() + restriction.action.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{restriction.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditRestriction(restriction)}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteRestriction(restriction.id)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Restriction</DialogTitle>
            <DialogDescription>
              Modify the restriction settings
            </DialogDescription>
          </DialogHeader>
          {selectedRestriction && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={selectedRestriction.type}
                  onValueChange={(value) => setSelectedRestriction({ ...selectedRestriction, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={selectedRestriction.name}
                  onChange={(e) => setSelectedRestriction({ ...selectedRestriction, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input
                  id="pattern"
                  value={selectedRestriction.pattern}
                  onChange={(e) => setSelectedRestriction({ ...selectedRestriction, pattern: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={selectedRestriction.action}
                  onValueChange={(value) => setSelectedRestriction({ ...selectedRestriction, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="allow">Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={selectedRestriction.description}
                  onChange={(e) => setSelectedRestriction({ ...selectedRestriction, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Update restriction logic here
              setIsEditOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 