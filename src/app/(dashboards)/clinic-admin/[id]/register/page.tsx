
'use client';
import { useState, useEffect, use, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowUp, ArrowDown, Search, History, PlusCircle, Loader } from 'lucide-react';
import { getPatientHistory } from '@/lib/data';
import type { Patient, Group, PatientHistoryEntry } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { registerPatient } from '@/lib/actions';
import { useActionState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


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
      getPatientHistory(patient.id, patient.clinicId).then(setHistory);
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
  groups,
  onPatientRegistered,
}: {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onPatientRegistered: () => void;
}) {
  const [state, formAction] = useActionState(registerPatient, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success && state.tokenNumber) {
      toast({
        title: 'Patient Registered',
        description: \`Token number ${state.tokenNumber} has been assigned.\`,
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
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Manual Patient Check-in</DialogTitle>
          <CardDescription>
            Fill in the details to add a patient to the queue.
          </CardDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="px-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupId">Clinic Group</Label>
              <Select name="groupId" required>
                <SelectTrigger className="h-7">
                  <SelectValue placeholder="Select a Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.doctors.map((d) => \`Dr. ${d.name}\`).join(', ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.groupId && (
                <p className="text-sm text-destructive">
                  {state.errors.groupId[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Patient Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., John Doe"
                  required
                  className="h-7"
                />
                {state?.errors?.name && (
                  <p className="text-sm text-destructive">
                    {state.errors.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="e.g., 42"
                  required
                  className="h-7"
                />
                {state?.errors?.age && (
                  <p className="text-sm text-destructive">
                    {state.errors.age[0]}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contactNumber">Phone Number</Label>
                    <Input id="contactNumber" name="contactNumber" placeholder="e.g., 9876543210" required className="h-7"/>
                    {state?.errors?.contactNumber && <p className="text-sm text-destructive">{state.errors.contactNumber[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email</Label>
                    <Input id="emailAddress" name="emailAddress" type="email" placeholder="Optional" className="h-7"/>
                    {state?.errors?.emailAddress && <p className="text-sm text-destructive">{state.errors.emailAddress[0]}</p>}
                </div>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup
                name="gender"
                defaultValue="male"
                className="flex gap-4"
              >
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
              {state?.errors?.gender && (
                <p className="text-sm text-destructive">
                  {state.errors.gender[0]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="bg-muted/50 px-6 py-4 mt-6 rounded-b-lg">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Register Patient</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function PatientRegistryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clinicId } = use(params);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const patientsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'patients'), where('clinicId', '==', clinicId));
  }, [firestore, clinicId]);
  const { data: allPatients, isLoading: patientsLoading, refetch } = useCollection<Patient>(patientsQuery);
  
  const groupsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'groups'), where('clinicId', '==', clinicId));
  }, [firestore, clinicId]);
  const { data: groups, isLoading: groupsLoading } = useCollection<Group>(groupsQuery);


  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patient;
    direction: 'asc' | 'desc';
  } | null>({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
  const { toast } = useToast();

  const closeCheckInModal = useCallback(() => {
    setCheckInModalOpen(false);
  }, []);

  const onPatientRegistered = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!allPatients) {
        setFilteredPatients([]);
        return;
    }

    let filteredData = [...allPatients];

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(patient => 
            patient.name.toLowerCase().includes(lowercasedQuery) ||
            (patient.tokenNumber && patient.tokenNumber.toLowerCase().includes(lowercasedQuery)) ||
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

  const handleGenerateToken = async (patient: Patient) => {
    if (!patient.groupId) {
         toast({
            title: "Error",
            description: \`Could not determine the group for ${patient.name}. Please use manual check-in.\`
        });
        return;
    }

    const formData = new FormData();
    formData.append('name', patient.name);
    formData.append('age', patient.age.toString());
    formData.append('gender', patient.gender);
    formData.append('groupId', patient.groupId);
    formData.append('contactNumber', patient.contactNumber);

    const result = await registerPatient(null, formData);

    if (result.success) {
        toast({
            title: "Token Generated",
            description: \`New token ${result.tokenNumber} generated for ${patient.name}.\`
        });
        refetch();
    } else {
         toast({
            variant: "destructive",
            title: "Failed to generate token",
            description: result.message || "An unknown error occurred."
        });
    }
  }

  const isLoading = isUserLoading || patientsLoading || groupsLoading;

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="space-y-1 w-full sm:w-auto">
              <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground">PATIENT SEARCH</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, Phone, Email..."
                  className="pl-9 h-10 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto self-end">
                <Button onClick={() => setCheckInModalOpen(true)} className="h-10 w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    MANUAL CHECK-IN
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-lg">Patients Register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                    Mobile
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
                <TableHead className="text-center">History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-4"><Loader className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>}
              {!isLoading && filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium py-2 text-xs">{patient.name}</TableCell>
                  <TableCell className="py-2 text-xs text-center">{patient.age}</TableCell>
                  <TableCell className="py-2 text-xs capitalize">
                    <Badge variant="secondary" className={cn('text-[10px] border-transparent capitalize', genderBadgeColors[patient.gender])}>
                        {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-xs">{patient.contactNumber}</TableCell>
                  <TableCell className="py-2 text-xs">{patient.emailAddress || '-'}</TableCell>
                  <TableCell className="py-2 text-xs">
                     {patient.registeredAt ? format((patient.registeredAt as any).toDate(), 'P, pp') : ''}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-center">
                     <Button size="xs" onClick={() => handleGenerateToken(patient)}>GENERATE</Button>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-center">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => openHistoryModal(patient)}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] h-7 gap-1"
                    >
                      <History className="h-3 w-3" />
                      Show History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && filteredPatients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-4 text-sm">
                        No patients found for this clinic.
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
        onClose={closeCheckInModal}
        groups={groups || []}
        onPatientRegistered={refetch}
      />
    </div>
  );
}
