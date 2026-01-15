
'use client';
import { useState, useEffect, useCallback } from 'react';
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
import type { Patient, ClinicGroup, Clinic } from '@/lib/types';
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
import { collection, query, where } from 'firebase/firestore';

const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'called': "bg-orange-100 text-orange-800",
    'in-consultation': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};


export default function LiveQueuePage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const patientsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'patients'), where('status', 'in', ['waiting', 'called', 'in-consultation']));
  }, [firestore]);
  const { data: allPatients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);

  const clinicsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'clinics'), where('type', '==', 'Clinic'));
  }, [firestore]);
  const { data: clinics, isLoading: clinicsLoading } = useCollection<Clinic>(clinicsQuery);

  const groupsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'clinics'), where('type', '==', 'Doctor'));
  }, [firestore]);
  const { data: clinicGroups, isLoading: groupsLoading } = useCollection<ClinicGroup>(groupsQuery);

  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'tokenNumber', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');

  const getClinicName = useCallback((clinicId: string) => {
    return clinics?.find(c => c.id === clinicId)?.name || 'Unknown';
  }, [clinics]);

  const getGroupName = useCallback((groupId: string) => {
    return clinicGroups?.find(g => g.id === groupId)?.name || 'Unknown';
  }, [clinicGroups]);

  const getDoctorName = useCallback((groupId: string) => {
      return clinicGroups?.find(c => c.id === groupId)?.doctors[0]?.name || 'Unknown';
  }, [clinicGroups]);

  useEffect(() => {
    if (!allPatients) {
        setFilteredPatients([]);
        return;
    };
    
    let filteredData = [...allPatients];

    if (selectedClinic !== 'all') {
      filteredData = filteredData.filter(patient => patient.clinicId === selectedClinic);
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
        const aVal = sortConfig.key === 'clinic' ? getClinicName(a.clinicId) : sortConfig.key === 'group' ? getGroupName(a.groupId) : sortConfig.key === 'doctor' ? getDoctorName(a.groupId) : a[sortConfig.key as keyof Patient];
        const bVal = sortConfig.key === 'clinic' ? getClinicName(b.clinicId) : sortConfig.key === 'group' ? getGroupName(b.groupId) : sortConfig.key === 'doctor' ? getDoctorName(b.groupId) : b[sortConfig.key as keyof Patient];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredPatients(sorted);
    } else {
        const sorted = [...filteredData].sort((a,b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
        setFilteredPatients(sorted);
    }

  }, [searchQuery, allPatients, sortConfig, clinicGroups, clinics, selectedClinic, getClinicName, getGroupName, getDoctorName]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3 inline" />;
    return <ArrowDown className="ml-2 h-3 w-3 inline" />;
  };

  const isLoading = isUserLoading || patientsLoading || clinicsLoading || groupsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Live Queue</h1>
     
      <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger id="clinicFilter" className="h-10 w-full sm:w-48 text-sm">
                  <SelectValue placeholder="All Clinics" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all" className="text-sm">All Clinics</SelectItem>
                  {clinics?.map(clinic => (
                      <SelectItem key={clinic.id} value={clinic.id} className="text-sm">{clinic.name}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  id="patientSearch"
                  placeholder="Name, token..." 
                  className="pl-9 h-10" 
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
              <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort('clinic')}>
                Clinic
                {getSortIcon('clinic')}
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
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-4">Loading...</TableCell></TableRow>}
            {!isLoading && filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-bold py-2 px-4 text-xs">{patient.tokenNumber}</TableCell>
                <TableCell className="py-2 px-4 text-xs">{patient.name}</TableCell>
                <TableCell className="py-2 px-4 text-xs">{getClinicName(patient.clinicId)}</TableCell>
                <TableCell className="py-2 px-4 text-xs">{getGroupName(patient.groupId)}</TableCell>
                <TableCell className="py-2 px-4 text-xs">{getDoctorName(patient.groupId)}</TableCell>
                <TableCell className="py-2 px-4 text-xs">{format(new Date(patient.registeredAt), 'hh:mm a')}</TableCell>
                <TableCell className="py-2 px-4 text-xs">
                   <Badge variant={'secondary'} className={cn("text-[10px] border-transparent capitalize", badgeColors[patient.status])}>
                        {patient.status.replace('-', ' ')}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
             {!isLoading && filteredPatients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-2 text-xs">
                        No active patients in any queue.
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
