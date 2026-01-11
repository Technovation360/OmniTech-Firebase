
'use client';
import { useState, useEffect, use } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  ArrowUp, 
  ArrowDown,
  Search,
  QrCode,
} from 'lucide-react';
import { getClinicGroups } from '@/lib/data';
import type { ClinicGroup } from '@/lib/types';
import { Input } from '@/components/ui/input';
import Link from 'next/link';


export default function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const [allGroups, setAllGroups] = useState<(ClinicGroup & { resources?: any })[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<(ClinicGroup & { resources?: any })[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getClinicGroups(clinicId).then(allGroupsData => {
        const groupsWithResources = allGroupsData.map((group, index) => ({
            ...group,
            resources: {
                docs: 1,
                asst: group.assistants.length,
                screens: 1,
                cabins: 1,
            }
        }));
        setAllGroups(groupsWithResources);
    })
  }, [clinicId]);

  useEffect(() => {
    let filteredData = allGroups;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allGroups.filter(group =>
            group.name.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof ClinicGroup] as any;
        const bVal = b[sortConfig.key as keyof ClinicGroup] as any;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredGroups(sorted);
    } else {
        setFilteredGroups(filteredData);
    }

  }, [searchQuery, allGroups, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };


  return (
    <>
      <Card>
        <CardHeader>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-lg">Clinic Groups</CardTitle>
                    <CardDescription className="text-xs mt-1">Manage clinical groups within your clinic.</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                            placeholder="Search by name..." 
                            className="pl-9 h-9" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="w-auto sm:w-auto flex-shrink-0">CREATE GROUP</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                        Group Name
                        {getSortIcon('name')}
                    </Button>
                </TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                    <TableCell className="font-medium py-2 text-xs">{group.name}</TableCell>
                    <TableCell className="py-2 text-xs">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">{group.resources.docs} Docs</Badge>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">{group.resources.asst} Asst</Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">{group.resources.screens} Screens</Badge>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">{group.resources.cabins} Cabins</Badge>
                        </div>
                    </TableCell>
                    <TableCell className="flex gap-2 py-2">
                        <Button variant="outline" size="xs" asChild>
                            <Link href={`/clinic-admin/${clinicId}/groups/qr-code?groupId=${group.id}`}>
                                <QrCode className="h-3 w-3 mr-1" />
                                Show QR
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon-xs"><Edit className="h-3 w-3"/></Button>
                        <Button variant="ghost" size="icon-xs"><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
