'use client';
import { useState, useEffect, use, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Patient, Group } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Search, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';

const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'calling': "bg-orange-100 text-orange-800",
    'consulting': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};


export default function ClinicLiveQueuePage({ params }: { params: Promise<{ id: string }>}) {
  const { id: clinicId } = use(params);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const patientsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'patient_transactions'), where('clinicId', '==', clinicId), where('status', 'in', ['waiting', 'consulting']));
  }, [firestore, clinicId]);
  const { data: allPatients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);

  const groupsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'groups'), where('clinicId', '==', clinicId));
  }, [firestore, clinicId]);
  const { data: groups, isLoading: groupsLoading } = useCollection<Group>(groupsQuery);


  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'tokenNumber', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  const getGroupName = useCallback((groupId: string) => {
    return groups?.find(g => g.id === groupId)?.name || 'Unknown';
  }, [groups]);

  const getDoctorName = useCallback((groupId: string) => {
    return groups?.find(g => g.id === groupId)?.doctors[0].name || 'Unknown';
  }, [groups]);

  useEffect(() => {
    if (!allPatients) {
        setFilteredPatients([]);
        return;
    }
    let filteredData = allPatients;

    if (selectedGroup !== 'all') {
      filteredData = filteredData.filter(patient => patient.groupId === selectedGroup);
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            patient.tokenNumber.toLowerCase().includes(lowercasedQuery) ||
            getGroupName(patient.groupId).toLowerCase().includes(lowercasedQuery) ||
            getDoctorName(patient.groupId).toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        let aVal, bVal;
        
        switch (sortConfig.key) {
            case 'group':
                aVal = getGroupName(a.groupId);
                bVal = getGroupName(b.groupId);
                break;
            case 'doctor':
                aVal = getDoctorName(a.groupId);
                bVal = getDoctorName(b.groupId);
                break;
            case 'registeredAt':
                 aVal = (a.registeredAt as any)?.seconds || 0;
                 bVal = (b.registeredAt as any)?.seconds || 0;
                 break;
            default:
                aVal = a[sortConfig.key as keyof Patient];
                bVal = b[sortConfig.key as keyof Patient];
        }


        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredPatients(sorted);
    } else {
       const sorted = [...filteredData].sort((a,b) => ((a.registeredAt as any) as Timestamp).toMillis() - ((b.registeredAt as any) as Timestamp).toMillis());
       setFilteredPatients(sorted);
    }

  }, [searchQuery, allPatients, sortConfig, groups, selectedGroup, getGroupName, getDoctorName]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3 inline-block" />;
    return <ArrowDown className="ml-2 h-3 w-3 inline-block" />;
  };

  const isLoading = isUserLoading || patientsLoading || groupsLoading;

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Live Queue</h1>
      
      <Card>
        <CardHeader>
           <div className="flex items-center gap-4">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="groupFilter" className="h-10 w-full sm:w-48 text-sm">
                    <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="text-sm">All Groups</SelectItem>
                    {groups?.map(group => (
                        <SelectItem key={group.id} value={group.id} className="text-sm">{group.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      id="search"
                      placeholder="Name, token..." 
                      className="pl-9 h-10 w-full sm:w-64" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('tokenNumber')}>
                    Token
                    {getSortIcon('tokenNumber')}
                </TableHead>
                <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('name')}>
                    Patient
                    {getSortIcon('name')}
                </TableHead>
                <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('group')}>
                    Group
                    {getSortIcon('group')}
                </TableHead>
                <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('doctor')}>
                    Doctor
                    {getSortIcon('doctor')}
                </TableHead>
                <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('registeredAt')}>
                    Issued At
                    {getSortIcon('registeredAt')}
                </TableHead>
                <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('status')}>
                    Status
                    {getSortIcon('status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>}
              {!isLoading && filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-bold py-2 px-4 text-xs">{patient.tokenNumber}</TableCell>
                  <TableCell className="py-2 px-4 text-xs">{patient.name}</TableCell>
                  <TableCell className="py-2 px-4 text-xs">{getGroupName(patient.groupId)}</TableCell>
                  <TableCell className="py-2 px-4 text-xs">{getDoctorName(patient.groupId)}</TableCell>
                  <TableCell className="py-2 px-4 text-xs">{format(((patient.registeredAt as any) as Timestamp).toDate(), 'hh:mm a')}</TableCell>
                  <TableCell className="py-2 px-4 text-xs">
                    <Badge variant={'secondary'} className={cn("text-[10px] border-transparent capitalize", badgeColors[patient.status])}>
                          {patient.status.replace('-', ' ')}
                      </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredPatients.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-2 text-xs">
                          No active patients in the queue.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
