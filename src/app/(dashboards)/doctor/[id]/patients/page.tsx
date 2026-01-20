
'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { getPatientHistory } from '@/lib/data';
import type { Patient, Group, PatientHistoryEntry, User, PatientTransaction, PatientMaster, EnrichedPatient } from '@/lib/types';
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
import { ArrowUp, ArrowDown, Search, History, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';


const badgeColors: Record<Patient['status'], string> = {
  waiting: 'bg-blue-100 text-blue-800',
  calling: 'bg-orange-100 text-orange-800',
  consulting: 'bg-green-100 text-green-800',
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
  
  useEffect(() => {
    if (patient) {
      getPatientHistory(patient.id).then(setHistory);
    } else {
      setHistory([]);
    }
  }, [patient, isOpen]);

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base font-bold tracking-normal uppercase">
            Visit History: {patient.name}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Token #</TableHead>
                <TableHead className="text-xs">Group</TableHead>
                <TableHead className="text-xs">Doctor</TableHead>
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
                  <TableCell className="py-2 text-xs">{item.groupName}</TableCell>
                  <TableCell className="py-2 text-xs">{item.doctorName}</TableCell>
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
  const [filteredPatients, setFilteredPatients] = useState<EnrichedPatient[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient;
    direction: 'asc' | 'desc';
  } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const doctorUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', doctorId);
  }, [firestore, doctorId]);
  const { data: doctorUser, isLoading: doctorUserLoading } = useDoc<User>(doctorUserRef);

  const doctorGroupsQuery = useMemoFirebase(() => {
    if (!doctorUser) return null;
    return query(collection(firestore, "groups"), where("doctors", "array-contains", { id: doctorId, name: doctorUser.name }));
  }, [firestore, doctorId, doctorUser]);

  const {data: doctorGroups, isLoading: groupsLoading} = useCollection<Group>(doctorGroupsQuery);
  const groupIds = useMemo(() => doctorGroups?.map(g => g.id) || [], [doctorGroups]);

  const transactionsQuery = useMemoFirebase(() => {
    if (groupIds.length === 0) return null;
    return query(collection(firestore, 'patient_transactions'), where('groupId', 'in', groupIds));
  }, [firestore, groupIds]);

  const { data: patientTransactions, isLoading: transactionsLoading } = useCollection<PatientTransaction>(transactionsQuery);
  
  const contactNumbers = useMemo(() => {
    if (!patientTransactions) return [];
    return [...new Set(patientTransactions.map(p => p.contactNumber).filter(Boolean))];
  }, [patientTransactions]);

  const patientMastersQuery = useMemoFirebase(() => {
      if (contactNumbers.length === 0) return null;
      const chunks = [];
      for (let i = 0; i < contactNumbers.length; i += 30) {
          chunks.push(contactNumbers.slice(i, i + 30));
      }
      if(chunks.length > 1) {
          console.warn("This page currently only supports fetching master records for up to 30 unique patients at a time.")
      }
      if (chunks.length === 0) return null;
      return query(collection(firestore, 'patient_master'), where('contactNumber', 'in', chunks[0]));
  }, [firestore, contactNumbers]);
  const { data: patientMasters, isLoading: mastersLoading } = useCollection<PatientMaster>(patientMastersQuery);
  
  const allPatients = useMemo<EnrichedPatient[]>(() => {
    if (!patientTransactions || !patientMasters) return [];
    const mastersMap = new Map(patientMasters.map(m => [m.contactNumber, m]));
    return patientTransactions.map(t => {
        const master = mastersMap.get(t.contactNumber);
        if (!master) return null;
        return { ...master, ...t, id: t.id };
    }).filter((p): p is EnrichedPatient => p !== null);
  }, [patientTransactions, patientMasters]);
  
  const uniquePatients = useMemo(() => {
    if (!allPatients) return [];
    const patientMap = new Map<string, EnrichedPatient>();
    allPatients.forEach(p => {
        const existingPatient = patientMap.get(p.contactNumber);
        if (!existingPatient || new Date(p.registeredAt) > new Date(existingPatient.registeredAt)) {
            patientMap.set(p.contactNumber, p);
        }
    });
    return Array.from(patientMap.values());
  }, [allPatients]);
  
  useEffect(() => {
    if (!uniquePatients) {
        setFilteredPatients([]);
        return;
    }
    let filteredData = [...uniquePatients];

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            (patient.contactNumber && patient.contactNumber.toLowerCase().includes(lowercasedQuery)) ||
            (patient.emailAddress && patient.emailAddress.toLowerCase().includes(lowercasedQuery))
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

  }, [searchQuery, uniquePatients, sortConfig]);

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

  const isLoading = isUserLoading || doctorUserLoading || groupsLoading || transactionsLoading || mastersLoading;

  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Patients Register</CardTitle>
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
                    Last Visit
                    {getSortIcon('registeredAt')}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-4"><Loader className="animate-spin mx-auto h-6 w-6" /></TableCell></TableRow>}
              {!isLoading && filteredPatients.map((patient) => (
                <TableRow key={patient.contactNumber}>
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
               {!isLoading && filteredPatients.length === 0 && (
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
