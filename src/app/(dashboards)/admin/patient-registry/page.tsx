
'use client';
import { useState, useEffect } from 'react';
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
import { ArrowUp, ArrowDown, Search, History, PlusCircle, Loader } from 'lucide-react';
import { getPatientHistory } from '@/lib/data';
import type { Patient, ClinicGroup, PatientHistoryEntry, Clinic } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { registerPatient } from '@/lib/actions';
import { useActionState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


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
  const firestore = useFirestore();
  const clinicsRef = useMemoFirebase(() => collection(firestore, 'groups'), [firestore]);
  const { data: clinicGroups, isLoading } = useCollection<ClinicGroup>(clinicsRef);

  useEffect(() => {
    if (patient) {
      getPatientHistory(patient.id).then(setHistory);
    } else {
      setHistory([]);
    }
  }, [patient, isOpen]);

  if (!patient) return null;
  
  const getClinicName = (clinicId: string) => {
    return clinicGroups?.find(c => c.id === clinicId)?.name || 'Unknown Clinic';
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
                         {clinicGroups?.map(clinic => (
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

function ManualCheckInModal({ 
    isOpen, 
    onClose, 
    clinicGroups,
    onPatientRegistered,
} : {
    isOpen: boolean;
    onClose: () => void;
    clinicGroups: ClinicGroup[];
    onPatientRegistered: () => void;
}) {
  const [state, formAction] = useActionState(registerPatient, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success && state.tokenNumber) {
      toast({
        title: 'Patient Registered',
        description: `Token number ${state.tokenNumber} has been assigned.`,
      });
      onPatientRegistered();
      onClose();
    } else if (state?.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: state.message,
      });
    }
  }, [state, toast, onClose, onPatientRegistered]);

  return (
     <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manual Patient Check-in</DialogTitle>
            <CardDescription>Fill in the details to add a patient to the queue.</CardDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-6 p-4">
               <div className="space-y-2">
                <Label htmlFor="groupId">Clinic Department</Label>
                <Select name="groupId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} (Dr. {group.doctors.map(d => d.name).join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {state?.errors?.groupId && <p className="text-sm text-destructive">{state.errors.groupId[0]}</p>}
              </div>
                
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Patient Name</Label>
                    <Input id="name" name="name" placeholder="e.g., John Doe" required />
                    {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="e.g., 42" required />
                    {state?.errors?.age && <p className="text-sm text-destructive">{state.errors.age[0]}</p>}
                </div>
              </div>


              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup name="gender" defaultValue="male" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
                {state?.errors?.gender && <p className="text-sm text-destructive">{state.errors.gender[0]}</p>}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit">Register Patient</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
  );
}

export default function PatientRegistryPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const patientsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'patients');
  }, [firestore, user]);
  const { data: allPatients, isLoading: patientsLoading, refetch: fetchPatients } = useCollection<Patient>(patientsRef);
  
  const clinicsRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'groups'), where('type', '==', 'Clinic'));
  }, [firestore, user]);
  const { data: clinics, isLoading: clinicsLoading } = useCollection<Clinic>(clinicsRef);
  
  const clinicGroupsRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'groups'), where('type', '==', 'Doctor'));
  }, [firestore, user]);
  const { data: clinicGroups, isLoading: groupsLoading } = useCollection<ClinicGroup>(clinicGroupsRef);

  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient;
    direction: 'asc' | 'desc';
  } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const { toast } = useToast();
  
  useEffect(() => {
    if (!allPatients) return;

    let filteredData = allPatients;

    if (selectedClinic !== 'all') {
      filteredData = filteredData.filter(patient => patient.clinicId === selectedClinic);
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            patient.tokenNumber.toLowerCase().includes(lowercasedQuery) ||
            patient.contactNumber?.toLowerCase().includes(lowercasedQuery) ||
            patient.emailAddress?.toLowerCase().includes(lowercasedQuery)
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

  }, [searchQuery, allPatients, sortConfig, selectedClinic]);

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

  const handleGenerateToken = async (patient: Patient) => {
    if (!patient.groupId) {
         toast({
            title: "Error",
            description: `Could not determine the group for ${patient.name}. Please use manual check-in.`
        });
        return;
    }

    const formData = new FormData();
    formData.append('name', patient.name);
    formData.append('age', patient.age.toString());
    formData.append('gender', patient.gender);
    formData.append('groupId', patient.groupId);

    const result = await registerPatient(null, formData);

    if (result.success) {
        toast({
            title: "Token Generated",
            description: `New token ${result.tokenNumber} generated for ${patient.name}.`
        });
    } else {
         toast({
            variant: "destructive",
            title: "Failed to generate token",
            description: result.message || "An unknown error occurred."
        });
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Patient Registry</h1>
      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="space-y-1 w-full sm:w-auto">
                  <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">PATIENT SEARCH</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Name, Phone, Email..."
                      className="pl-9 h-8 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1 w-full sm:w-auto">
                  <Label htmlFor="clinicFilter" className="text-xs font-semibold text-muted-foreground">FILTER BY CLINIC</Label>
                  <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                      <SelectTrigger id="clinicFilter" className="h-8 w-full sm:w-48 text-sm">
                          <SelectValue placeholder="Filter by Clinic" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all" className="text-sm">All Clinics</SelectItem>
                          {clinics?.map(clinic => (
                              <SelectItem key={clinic.id} value={clinic.id} className="text-sm">{clinic.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 self-end">
                <p className="text-xs font-medium text-muted-foreground text-right">{filteredPatients.length} REGISTERED PATIENTS</p>
                <Button onClick={() => setCheckInModalOpen(true)} size="sm" className="h-8">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    MANUAL CHECK-IN
                </Button>
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
                <TableHead>
                  <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    {getSortIcon('age')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('gender')}
                  >
                    Gender
                    {getSortIcon('gender')}
                  </Button>
                </TableHead>
                <TableHead>
                   <Button
                    variant="ghost"
                    className="text-xs p-0 hover:bg-transparent"
                    onClick={() => handleSort('contactNumber')}
                  >
                    Contact
                    {getSortIcon('contactNumber')}
                  </Button>
                </TableHead>
                <TableHead>
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
                <TableHead className="text-center">Token</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(patientsLoading || clinicsLoading) && <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>}
              {!(patientsLoading || clinicsLoading) && filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium py-2 text-xs">{patient.name}</TableCell>
                  <TableCell className="py-2 text-xs">
                    {patient.age}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <Badge variant="secondary" className={cn('text-[10px] border-transparent capitalize', genderBadgeColors[patient.gender])}>
                        {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-xs">{patient.contactNumber}</TableCell>
                  <TableCell className="py-2 text-xs">{patient.emailAddress}</TableCell>
                  <TableCell className="py-2 text-xs">
                     {format(new Date(patient.registeredAt), 'P, pp')}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-center">
                     <Button size="xs" onClick={() => handleGenerateToken(patient)}>GENERATE</Button>
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
               {!patientsLoading && !clinicsLoading && filteredPatients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-4 text-sm">
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
       <ManualCheckInModal 
        isOpen={isCheckInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        clinicGroups={clinicGroups || []}
        onPatientRegistered={() => {}}
      />
    </>
  );
}

    