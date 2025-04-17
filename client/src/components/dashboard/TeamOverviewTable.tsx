import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface TeamMember {
  id: number;
  name: string;
  department: string;
  activeTime: number;
  productivityScore: number;
  topApplication: string;
  status: string;
  avatarColor: string;
}

export default function TeamOverviewTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard/team-overview"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/team-overview");
      if (!response.ok) {
        throw new Error("Failed to fetch team overview data");
      }
      return response.json();
    },
  });

  // Format time in seconds to hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Filter and paginate team members
  const filteredMembers = data?.filter((member: TeamMember) => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const paginatedMembers = filteredMembers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent/10 text-accent';
      case 'away':
        return 'bg-neutral-light text-neutral-medium';
      case 'offline':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-neutral-light text-neutral-medium';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-dark">Team Overview</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium h-4 w-4" />
            <Input
              type="text"
              placeholder="Search team members..."
              className="pl-8 pr-4 py-1 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-medium text-neutral-medium">Name</TableHead>
                <TableHead className="text-left font-medium text-neutral-medium">Dept</TableHead>
                <TableHead className="text-left font-medium text-neutral-medium">Active Time</TableHead>
                <TableHead className="text-left font-medium text-neutral-medium">Productivity</TableHead>
                <TableHead className="text-left font-medium text-neutral-medium">Top Application</TableHead>
                <TableHead className="text-left font-medium text-neutral-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading team data...
                  </TableCell>
                </TableRow>
              ) : paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member: TeamMember) => (
                  <TableRow key={member.id} className="hover:bg-neutral-light/20">
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2" style={{ backgroundColor: `${member.avatarColor}20`, color: member.avatarColor }}>
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>{member.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>{formatTime(member.activeTime)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-neutral-light/50 rounded-full overflow-hidden mr-2">
                          <div 
                            className={`h-full rounded-full ${
                              member.productivityScore >= 75 ? 'bg-accent' : 
                              member.productivityScore >= 50 ? 'bg-warning' : 'bg-danger'
                            }`} 
                            style={{ width: `${member.productivityScore}%` }}
                          />
                        </div>
                        <span>{member.productivityScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.topApplication}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusClassName(member.status)}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between items-center mt-4 text-sm">
          <div className="text-neutral-medium">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredMembers.length)} of {filteredMembers.length} team members
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }} 
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    href="#" 
                    isActive={pageNum === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pageNum);
                    }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
