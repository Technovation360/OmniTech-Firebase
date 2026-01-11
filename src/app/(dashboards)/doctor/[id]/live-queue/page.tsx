
'use client';

import { use, useState, useEffect } from 'react';
import { getPatientsByGroupId, getClinicGroupById } from '@/lib/data';
import type { Patient, ClinicGroup } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const badgeColors: Record<Patient['status'], string> = {
    'waiting': "bg-blue-100 text-blue-800",
    'called': "bg-orange-100 text-orange-800",
    'in-consultation': "bg-green-100 text-green-800",
    'consultation-done': "bg-gray-100 text-gray-800",
    'no-show': "bg-red-100 text-red-800",
};

export default function DoctorLiveQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: doctorId } = use(params);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [clinic, setClinic] = useState<ClinicGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'tokenNumber', direction: 'asc' });

  useEffect(() => {
    const groupId = doctorId === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01';
    Promise.all([
        getClinicGroupById(groupId),
        getPatientsByGroupId(groupId)
    ]).then(([clinicData, patientData]) => {
      setClinic(clinicData || null);
      setAllPatients(patientData.filter(p => ['waiting', 'called', 'in-consultation'].includes(p.status)));
      setLoading(false);
    });
  }, [doctorId]);

  const getGroupName = () => clinic?.name || 'Unknown';
  const getDoctorName = () => clinic?.doctors[0]?.name || 'Unknown';

  useEffect(() => {
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
  }, [searchQuery, allPatients, sortConfig, clinic]);

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

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Live Patient Queue</CardTitle>
                <CardDescription>A real-time view of patients in your queue.</CardDescription>
            </div>
             <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Name, Number, Email"
                  className="pl-9 h-7"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
