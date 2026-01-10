
'use client';

import { use, useState, useEffect } from 'react';
import {
  getPatientsByClinicId,
  getClinicGroups,
  getPatientHistory,
} from '@/lib/data';
import type { Patient, ClinicGroup, PatientHistoryEntry } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const badgeColors: Record<Patient['status'], string> = {
  waiting: 'bg-blue-100 text-blue-800',
  called: 'bg-orange-100 text-orange-800',
  'in-consultation': 'bg-green-100 text-green-800',
  'consultation-done': 'bg-gray-100 text-gray-800',
  'no-show': 'bg-red-100 text-red-800',
};

const genderBadgeColors: Record<Patient['gender'], string> = {
    'male': "bg-blue-100 text-blue-800",
    'female': "bg-pink-100 text-pink-800",
    'other': "bg-purple-100 text-purple-800",
};


function VisitHistoryModal({
  isOpen,
  onClose,
  patient,
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}) {
  const [history, setHistory] = useState<PatientHistoryEntry[]>([]);
  const [clinics, setClinics] = useState<ClinicGroup[]>([]);

  useEffect(() => {
    if (patient) {
      getPatientHistory(patient.id).then(setHistory);
    } else {
      setHistory([]);
    }

    if (isOpen) {
        getClinicGroups().then(setClinics);
    }

  }, [patient, isOpen]);

  if (!patient) return null;
  
  const getClinicName = (clinicId: string) => {
    return clinics.find(c => c.id === clinicId)?.name || 'Unknown Clinic';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base font-bold tracking-normal uppercase">
            Visit History: {patient.name}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Accordion type="single" collapsible className="w-full mb-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xs font-semibold bg-gray-50 px-4 rounded-md">
                ADVANCED VISIT SEARCH
              </AccordionTrigger>
              <AccordionContent className="p-4 border rounded-b-md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="clinic" className="text-[10px]">
                      CLINIC
                    </Label>
                    <Select>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                         {clinics.map(clinic => (
                          <SelectItem key={clinic.id} value={clinic.id} className="text-xs">{clinic.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="from-date" className="text-[10px]">
                      FROM DATE
                    </Label>
                    <Input id="from-date" type="date" className="h-7 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="to-date" className="text-[10px]">
                      TO DATE
                    </Label>
                    <Input id="to-date" type="date" className="h-7 text-xs" />
                  </div>
                  <Button className="self-end h-7">Search</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Token #</TableHead>
                <TableHead className="text-xs">Clinic</TableHead>
                <TableHead className="text-xs">Issued Date/Time</TableHead>
                <TableHead className="text-xs">Start Time</TableHead>
                <TableHead className="text-xs">Stop Time</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.tokenNumber}>
                  <TableCell className="font-medium text-primary py-2 text-xs">
                    {item.tokenNumber}
                  </TableCell>
                  <TableCell className="py-2 text-xs">{item.clinicName}</TableCell>
                  <TableCell className="py-2 text-xs">
                    {format(new Date(item.issuedAt), 'P, pp')}
                  </TableCell>
                   <TableCell className="py-2 text-xs">
                    {item.startTime ? format(new Date(item.startTime), 'pp') : '-'}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    {item.endTime ? format(new Date(item.endTime), 'pp') : '-'}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] border-transparent capitalize',
                        badgeColors[item.status]
                      )}
                    >
                      {item.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="bg-gray-50 px-4 py-3">
          <Button onClick={onClose} className="w-full">
            DONE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DoctorPatientsPage({ params }: { params: { id: string } }) {
  const { id: doctorId } = use(params);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient;
    direction: 'asc' | 'desc';
  } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const clinicId = doctorId === 'doc_ashish' ? 'grp_cardiology_01' : 'grp_ortho_01';
    getPatientsByClinicId(clinicId).then((data) => {
      setAllPatients(data);
    });
  }, [doctorId]);
  
  useEffect(() => {
    let filteredData = allPatients;

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            patient.tokenNumber.toLowerCase().includes(lowercasedQuery) ||
            patient.contactNumber.toLowerCase().includes(lowercasedQuery) ||
            patient.emailAddress.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    if (sortConfig) {
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setFilteredPatients(sorted);
    } else {
        setFilteredPatients(filteredData);
    }

  }, [searchQuery, allPatients, sortConfig]);

  const handleSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Patient) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const openHistoryModal = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const closeHistoryModal = () => {
    setSelectedPatient(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">My Patients</CardTitle>
              <CardDescription className="text-xs mt-1">
                List of all patients in your clinic.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-9"
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
                <TableHead>
                  <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('name')}
                  >
                    Patient Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="px-2">
                  <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    {getSortIcon('age')}
                  </Button>
                </TableHead>
                <TableHead className="px-2">
                   <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('gender')}
                  >
                    Gender
                    {getSortIcon('gender')}
                  </Button>
                </TableHead>
                <TableHead className="px-2">
                   <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('contactNumber')}
                  >
                    Contact
                    {getSortIcon('contactNumber')}
                  </Button>
                </TableHead>
                <TableHead className="px-2">
                   <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('emailAddress')}
                  >
                    Email
                    {getSortIcon('emailAddress')}
                  </Button>
                </TableHead>
                <TableHead>
                   <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('registeredAt')}
                  >
                    Last Token Generated
                    {getSortIcon('registeredAt')}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium py-2 text-xs">{patient.name}</TableCell>
                  <TableCell className="py-2 px-2 text-xs">{patient.age}</TableCell>
                  <TableCell className="py-2 px-2 text-xs capitalize">
                    <Badge variant="secondary" className={cn('text-[10px] border-transparent capitalize', genderBadgeColors[patient.gender])}>
                        {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-xs">{patient.contactNumber}</TableCell>
                  <TableCell className="py-2 px-2 text-xs">{patient.emailAddress}</TableCell>
                  <TableCell className="py-2 text-xs">
                     {format(new Date(patient.registeredAt), 'P, pp')}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => openHistoryModal(patient)}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] h-7 gap-1"
                    >
                      <History className="h-3 w-3" />
                      Visit History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {filteredPatients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-4 text-sm">
                        No patients found.
                    </TableCell>
                </TableRow>
             )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VisitHistoryModal
        isOpen={!!selectedPatient}
        onClose={closeHistoryModal}
        patient={selectedPatient}
      />
    </>
  );
}

    

    