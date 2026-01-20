
'use client';

import { use, useState, useEffect, useCallback } from 'react';
import type { Patient, Group, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';


const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'calling': "bg-orange-100 text-orange-800",
    'consulting': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};

export default function DoctorLiveQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: doctorId } = use(params);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'tokenNumber', direction: 'asc' });

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const doctorUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', doctorId);
  }, [firestore, doctorId]);
  const { data: doctorUser, isLoading: doctorUserLoading } = useDoc<User>(doctorUserRef);

  const doctorGroupIdQuery = useMemoFirebase(() => {
    if (!doctorUser) return null;
    return query(collection(firestore, "groups"), where("doctors", "array-contains", { id: doctorId, name: doctorUser.name }));
  }, [firestore, doctorId, doctorUser]);

  const {data: doctorGroups, isLoading: groupsLoading} = useCollection<Group>(doctorGroupIdQuery);
  const groupId = doctorGroups?.[0]?.id;

  const patientsQuery = useMemoFirebase(() => {
    if (!groupId) return null;
    return query(collection(firestore, 'patient_transactions'), where('groupId', '==', groupId), where('status', 'in', ['waiting', 'consulting']));
  }, [firestore, groupId]);

  const { data: allPatients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);

  const groupQuery = useMemoFirebase(() => {
      if (!groupId) return null;
      return doc(firestore, 'groups', groupId);
  }, [firestore, groupId]);
  const { data: clinic, isLoading: groupLoading } = useDoc<Group>(groupQuery);

  const getGroupName = useCallback(() => clinic?.name || 'Unknown', [clinic]);
  const getDoctorName = useCallback(() => clinic?.doctors.find(d => d.id === doctorId)?.name || 'Unknown', [clinic, doctorId]);

  useEffect(() => {
    if (!allPatients) {
        setFilteredPatients([]);
        return;
    }
    let filteredData = allPatients;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = allPatients.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            patient.tokenNumber.toLowerCase().includes(lowercasedQuery)
        );
    }

    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        let aVal, bVal;
        
        switch (sortConfig.key) {
            case 'group':
                aVal = getGroupName();
                bVal = getGroupName();
                break;
            case 'doctor':
                aVal = getDoctorName();
                bVal = getDoctorName();
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
        setFilteredPatients(filteredData);
    }
  }, [searchQuery, allPatients, sortConfig, getGroupName, getDoctorName]);

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

  if (isUserLoading || doctorUserLoading || groupsLoading || patientsLoading || groupLoading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Live Queue</CardTitle>
            </div>
             <div className="space-y-1">
                <Label htmlFor="patientSearch" className="font-medium text-xs text-muted-foreground">Patient Search</Label>
                <div className="relative w-full sm:w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                    id="patientSearch"
                    placeholder="Search by Name, Number, Email"
                    className="pl-9 h-6 placeholder:text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="p-2">
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('tokenNumber')}>
                    Token
                    {getSortIcon('tokenNumber')}
                </Button>
              </TableHead>
              <TableHead className="p-2">
                 <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Patient
                    {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead className="p-2">
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('group')}>
                    Group
                    {getSortIcon('group')}
                </Button>
              </TableHead>
               <TableHead className="p-2">
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('doctor')}>
                    Doctor
                    {getSortIcon('doctor')}
                </Button>
              </TableHead>
              <TableHead className="p-2">
                 <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('registeredAt')}>
                    Issued At
                    {getSortIcon('registeredAt')}
                </Button>
              </TableHead>
              <TableHead className="p-2">
                 <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('status')}>
                    Status
                    {getSortIcon('status')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length > 0 ? filteredPatients.map(patient => (
              <TableRow key={patient.id}>
                <TableCell className="font-bold p-2 text-xs">{patient.tokenNumber}</TableCell>
                <TableCell className="p-2 text-xs">{patient.name}</TableCell>
                <TableCell className="p-2 text-xs">{getGroupName()}</TableCell>
                <TableCell className="p-2 text-xs">{getDoctorName()}</TableCell>
                <TableCell className="p-2 text-xs">{format(new Date(patient.registeredAt), 'hh:mm a')}</TableCell>
                <TableCell className="p-2 text-xs">
                  <Badge variant="secondary" className={cn("capitalize", badgeColors[patient.status])}>
                    {patient.status.replace('-', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No patients in the queue.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
