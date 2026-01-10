
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { getPatientsByClinicId, getClinicGroups } from '@/lib/data';
import type { Patient, ClinicGroup } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'called': "bg-orange-100 text-orange-800",
    'in-consultation': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};


export default function LiveQueuePage() {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<ClinicGroup[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'tokenNumber', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');

  useEffect(() => {
    getClinicGroups().then(allClinics => {
        setClinics(allClinics);
        // Fetch patients from all clinics
        Promise.all(allClinics.map(c => getPatientsByClinicId(c.id))).then(patientArrays => {
            const allPatientsData = patientArrays.flat()
                .filter(p => p.status === 'waiting' || p.status === 'called' || p.status === 'in-consultation')
                .sort((a,b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
            setAllPatients(allPatientsData);
        })
    });
  }, []);
  
  const getClinicName = (clinicId: string) => {
    return clinics.find(c => c.id === clinicId)?.name || 'Unknown';
  }

  const getDoctorName = (clinicId: string) => {
      return clinics.find(c => c.id === clinicId)?.doctor.name || 'Unknown';
  }

  useEffect(() => {
    let filteredData = allPatients;

    if (selectedClinic !== 'all') {
      filteredData = filteredData.filter(patient => patient.clinicId === selectedClinic);
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            patient.tokenNumber.toLowerCase().includes(lowercasedQuery) ||
            getClinicName(patient.clinicId).toLowerCase().includes(lowercasedQuery) ||
            getDoctorName(patient.clinicId).toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = sortConfig.key === 'clinic' ? getClinicName(a.clinicId) : sortConfig.key === 'doctor' ? getDoctorName(a.clinicId) : a[sortConfig.key as keyof Patient];
        const bVal = sortConfig.key === 'clinic' ? getClinicName(b.clinicId) : sortConfig.key === 'doctor' ? getDoctorName(b.clinicId) : b[sortConfig.key as keyof Patient];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredPatients(sorted);
    } else {
        setFilteredPatients(filteredData);
    }

  }, [searchQuery, allPatients, sortConfig, clinics, selectedClinic]);

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
     <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Live Queue</CardTitle>
                <CardDescription>A real-time overview of all patient queues across all clinics.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                  <SelectTrigger className="h-9 w-full sm:w-48 text-xs">
                      <SelectValue placeholder="Filter by Clinic" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all" className="text-xs">All Clinics</SelectItem>
                      {clinics.map(clinic => (
                          <SelectItem key={clinic.id} value={clinic.id} className="text-xs">{clinic.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search patients..." 
                      className="pl-9 h-9" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('tokenNumber')}>
                    Token
                    {getSortIcon('tokenNumber')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('name')}>
                    Patient
                    {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('clinic')}>
                    Clinic
                    {getSortIcon('clinic')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('doctor')}>
                    Doctor
                    {getSortIcon('doctor')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('registeredAt')}>
                    Issued At
                    {getSortIcon('registeredAt')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="text-xs p-0 hover:bg-transparent" onClick={() => handleSort('status')}>
                    Status
                    {getSortIcon('status')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-bold py-2 text-xs">{patient.tokenNumber}</TableCell>
                <TableCell className="py-2 text-xs">{patient.name}</TableCell>
                <TableCell className="py-2 text-xs">{getClinicName(patient.clinicId)}</TableCell>
                <TableCell className="py-2 text-xs">{getDoctorName(patient.clinicId)}</TableCell>
                <TableCell className="py-2 text-xs">{format(new Date(patient.registeredAt), 'hh:mm a')}</TableCell>
                <TableCell className="py-2 text-xs">
                   <Badge variant={'secondary'} className={cn("text-[10px] border-transparent capitalize", badgeColors[patient.status])}>
                        {patient.status.replace('-', ' ')}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
             {filteredPatients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-2 text-xs">
                        No active patients in any queue.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
