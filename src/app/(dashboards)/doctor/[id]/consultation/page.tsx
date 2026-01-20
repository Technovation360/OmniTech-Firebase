'use client';

import { useState, useEffect, use, useMemo, useActionState, useCallback } from 'react';
import type { Patient, Group, User, PatientHistoryEntry, Consultation, Cabin } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  CheckSquare,
  XCircle,
  Loader,
  Lock,
  Play,
  Square,
  UserX,
  History,
  PhoneCall,
  FileText,
  LogOut,
  CheckCircle,
  PlusCircle,
  Stethoscope,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handlePatientAction, registerPatient } from '@/lib/actions';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { getPatientHistory } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type DoctorPageProps = {
  params: Promise<{ id: string }>;
};

const badgeColors: Record<Patient['status'], string> = {
  'waiting': "bg-blue-100 text-blue-800",
  'calling': "bg-orange-100 text-orange-800",
  'consulting': "bg-green-100 text-green-800",
  'consultation-done': "bg-gray-100 text-gray-800",
  'no-show': "bg-red-100 text-red-800",
};


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
                      {group.name} ({group.doctors.map(d => `Dr. ${d.name}`).join(', ')})
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
                    <Input id="contactNumber" name="contactNumber" placeholder="e.g., 9876543210" required className="h-7" />
                    {state?.errors?.contactNumber && <p className="text-sm text-destructive">{state.errors.contactNumber[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email</Label>
                    <Input id="emailAddress" name="emailAddress" type="email" placeholder="Optional" className="h-7" />
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
    if (patient && isOpen) {
      getPatientHistory(patient.id, patient.clinicId).then(setHistory);
    } else if (!isOpen) {
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
        <div className="p-4 max-h-[60vh] overflow-y-auto">
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
               {history.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        No visit history found.
                    </TableCell>
                </TableRow>
               )}
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


function RoomCard({ 
    doctorId,
    cabin, 
    patient, 
    onAssignDoctor,
    onCallNext,
    onLeave, 
    onAction,
    onViewHistory,
    onCallPatient,
    onRevertPatient,
}: { 
    doctorId: string;
    cabin: Cabin, 
    patient: Patient | null, 
    onAssignDoctor: (cabinId: string) => void,
    onCallNext: (cabinId: string) => void,
    onLeave: (cabinId: string) => void,
    onAction: (patientId: string, cabinId: string, action: 'start' | 'end' | 'no-show') => void,
    onViewHistory: (patient: Patient) => void,
    onCallPatient: (patient: Patient) => void,
    onRevertPatient: (patientId: string, cabinId: string) => void,
}) {
    const { toast } = useToast();
    const [noShowEnabled, setNoShowEnabled] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let timerId: NodeJS.Timeout | undefined;
        let countdownInterval: NodeJS.Timeout | undefined;

        if (patient && patient.status === 'calling') {
            setNoShowEnabled(false);
            setTimer(30);

            timerId = setTimeout(() => {
                setNoShowEnabled(true);
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
            }, 30000);

            countdownInterval = setInterval(() => {
                setTimer((prev) => {
                    if (prev > 1) {
                        return prev - 1;
                    }
                    if(countdownInterval) clearInterval(countdownInterval);
                    return 0;
                });
            }, 1000);
        }

        return () => {
            if (timerId) clearTimeout(timerId);
            if (countdownInterval) clearInterval(countdownInterval);
        };
    }, [patient]);


    if (!cabin) {
        return (
             <Card>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                    <CardTitle className="text-sm font-semibold">LOADING...</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-48 flex items-center justify-center">
                    <Loader className="animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (!cabin.assignedDoctorId) {
        return (
             <Card>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                    <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-yellow-100 rounded-full mb-2">
                        <Lock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mb-4">ROOM VACANT</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAssignDoctor(cabin.id)}>
                        <PlusCircle className="mr-1 h-3 w-3" />
                        Assign
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (cabin.assignedDoctorId !== doctorId) {
         return (
             <Card>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-gray-200 h-[53px]">
                    <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center bg-gray-50">
                     <div className="p-3 bg-red-100 rounded-full mb-2">
                       <Stethoscope className="h-6 w-6 text-red-500" />
                   </div>
                   <p className="text-sm font-bold text-red-600 mb-1">ROOM OCCUPIED</p>
                   <p className="text-xs font-semibold text-muted-foreground">Assigned to Dr. {cabin.assignedDoctorName}</p>
                </CardContent>
            </Card>
       );
    }

    // Assigned to current doctor
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                 <Button variant="destructive" size="xs" className="h-7" onClick={() => patient ? onRevertPatient(patient.id, cabin.id) : onLeave(cabin.id)}>
                    <LogOut className="mr-1 h-3 w-3" />
                    Leave
                </Button>
            </CardHeader>
            <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                { !patient ? (
                     <>
                        <div className="p-3 bg-blue-100 rounded-full mb-2">
                           <Stethoscope className="h-6 w-6 text-blue-500" />
                       </div>
                       <p className="text-sm font-semibold text-muted-foreground mb-4">ROOM ASSIGNED</p>
                       <Button size="sm" onClick={() => onCallNext(cabin.id)}>
                           <PhoneCall className="mr-2 h-4 w-4"/>
                           Call Patient
                       </Button>
                   </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-between">
                         <div className="text-center">
                            <p className="font-bold text-4xl text-primary">{patient.tokenNumber}</p>
                            <p className="font-semibold">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.age} / {patient.gender.charAt(0).toUpperCase()}</p>
                        </div>
                        {patient.status === 'consulting' ? (
                             <div className="grid grid-cols-2 gap-2 w-full">
                                <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => onAction(patient!.id, cabin.id, 'end')}>
                                    <Square className="mr-2 h-4 w-4"/> End
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => toast({ title: 'Add Notes', description: 'This would open a notes editor.' })}>
                                    <FileText className="mr-2 h-4 w-4"/> Add Notes
                                </Button>
                                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onCallPatient(patient)}>
                                    <PhoneCall className="mr-2 h-4 w-4"/> Call Patient
                                </Button>
                                 <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                                    <History className="mr-2 h-4 w-4"/> History
                                </Button>
                            </div>
                        ) : ( // 'calling' status
                             <div className="grid grid-cols-2 gap-2 w-full">
                                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => onAction(patient!.id, cabin.id, 'start')}>
                                    <Play className="mr-2 h-4 w-4"/> Start
                                </Button>
                                <Button size="sm" variant="outline" disabled={!noShowEnabled} onClick={() => onAction(patient!.id, cabin.id, 'no-show')} className={cn(noShowEnabled && 'text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive')}>
                                    { !noShowEnabled ? (
                                        <span className="text-xs font-mono w-full text-center">No Show ({timer}s)</span>
                                    ) : (
                                        <><UserX className="mr-2 h-4 w-4"/> No Show</>
                                    )}
                                </Button>
                                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onCallPatient(patient)}>
                                    <PhoneCall className="mr-2 h-4 w-4"/> Call Patient
                                </Button>
                                 <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                                    <History className="mr-2 h-4 w-4"/> History
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


export default function DoctorConsultationPageLoader({ params }: DoctorPageProps) {
  const { id } = use(params);
  const firestore = useFirestore();
  
  const doctorUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: doctorUser, isLoading: doctorUserLoading } = useDoc<User>(doctorUserRef);
  
  const doctorGroupsQuery = useMemoFirebase(() => {
    if (!doctorUser) return null;
    return query(collection(firestore, "groups"), where("doctors", "array-contains", { id: id, name: doctorUser.name }));
  }, [firestore, id, doctorUser]);

  const {data: doctorGroups, isLoading: groupsLoading} = useCollection<Group>(doctorGroupsQuery);
  
  if (doctorUserLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!doctorGroups || doctorGroups.length === 0) {
       return (
         <div className="flex items-center justify-center h-full">
            <p>Could not load doctor's dashboard. Ensure doctor is assigned to a group.</p>
        </div>
       )
  }

  return <DoctorConsultationDashboard doctorId={id} groups={doctorGroups} />;
}


function DoctorConsultationDashboard({
  doctorId,
  groups,
}: {
  doctorId: string,
  groups: Group[];
}) {
    const firestore = useFirestore();
    const { data: doctorUser } = useDoc<User>(doc(firestore, 'users', doctorId));
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id);
    const { toast } = useToast();
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);

    const [refetchIndex, setRefetchIndex] = useState(0);
    const refetchPatients = useCallback(() => setRefetchIndex(p => p + 1), []);

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    
    const patientsQuery = useMemoFirebase(() => {
        if (!selectedGroupId) return null;
        return query(collection(firestore, 'patient_transactions'), where('groupId', '==', selectedGroupId));
    }, [firestore, selectedGroupId, refetchIndex]);
    const { data: allPatients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);
    
    const cabinIds = useMemo(() => selectedGroup?.cabins.map(c => c.id) || [], [selectedGroup]);
    const cabinsQuery = useMemoFirebase(() => {
        if (cabinIds.length === 0) return null;
        return query(collection(firestore, 'cabins'), where('__name__', 'in', cabinIds));
    }, [firestore, cabinIds]);
    const { data: liveCabins, isLoading: cabinsLoading } = useCollection<Cabin>(cabinsQuery);


    const closeCheckInModal = useCallback(() => setCheckInModalOpen(false), []);
    const onPatientRegistered = useCallback(() => { refetchPatients(); }, [refetchPatients]);


    const handleAssignDoctorToRoom = (cabinId: string) => {
        const cabinDocRef = doc(firestore, 'cabins', cabinId);
        const cabinData = liveCabins?.find(c => c.id === cabinId);
        if (cabinData?.assignedDoctorId) {
            toast({ variant: 'destructive', title: 'Room Occupied', description: `${cabinData.name} is already assigned to Dr. ${cabinData.assignedDoctorName}.` });
            return;
        }

        if (!doctorUser) return;

        setDocumentNonBlocking(cabinDocRef, {
            assignedDoctorId: doctorId,
            assignedDoctorName: doctorUser.name
        }, { merge: true });
        toast({ title: 'Room Assigned', description: `You are now assigned to ${cabinData?.name}.` });
    };

    const handleCallNextPatient = (cabinId: string) => {
        const waitingPatients = (allPatients || []).filter(p => p.status === 'waiting').sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
        if (waitingPatients.length === 0) {
            toast({ variant: 'destructive', title: "No patients in queue", description: "There are no patients waiting." });
            return;
        }
        const nextPatient = waitingPatients[0];

        const patientDocRef = doc(firestore, 'patient_transactions', nextPatient.id);
        const cabinDocRef = doc(firestore, 'cabins', cabinId);

        setDocumentNonBlocking(patientDocRef, { status: 'calling', cabinId: cabinId }, { merge: true });
        setDocumentNonBlocking(cabinDocRef, { patientInCabinId: nextPatient.id }, { merge: true });
        
        toast({ title: "Patient Called", description: `${nextPatient.name} has been called.`});
    };
    
    const handleLeaveRoom = (cabinId: string) => {
        const cabinDocRef = doc(firestore, 'cabins', cabinId);
        setDocumentNonBlocking(cabinDocRef, {
            assignedDoctorId: null,
            assignedDoctorName: null,
            patientInCabinId: null
        }, { merge: true });
         toast({ title: 'Room Vacated' });
    };
    
    const handleRoomAction = (patientId: string, cabinId: string, action: 'start' | 'end' | 'no-show') => {
        const patientDocRef = doc(firestore, 'patient_transactions', patientId);
        const cabinDocRef = doc(firestore, 'cabins', cabinId);

        if (action === 'start') {
            setDocumentNonBlocking(patientDocRef, { status: 'consulting' }, { merge: true });
            toast({ title: `Consultation Started` });
        } else {
            const newStatus = action === 'end' ? 'consultation-done' : 'no-show';
            setDocumentNonBlocking(patientDocRef, { status: newStatus, cabinId: null }, { merge: true });
            setDocumentNonBlocking(cabinDocRef, { patientInCabinId: null }, { merge: true });
            toast({ title: `Consultation ${newStatus.replace('-', ' ')}` });
        }
    };
    
    const handleRevertPatient = (patientId: string, cabinId: string) => {
        const patientDocRef = doc(firestore, 'patient_transactions', patientId);
        const cabinDocRef = doc(firestore, 'cabins', cabinId);
        
        setDocumentNonBlocking(patientDocRef, { status: 'waiting', cabinId: null }, { merge: true });
        setDocumentNonBlocking(cabinDocRef, { patientInCabinId: null, assignedDoctorId: null, assignedDoctorName: null }, { merge: true });
        toast({ title: 'Room Vacated', description: 'Patient sent back to the waiting queue.' });
    };


    const handleCallPatient = (patient: Patient) => {
        toast({ title: `Calling ${patient.name}`, description: `Re-announcing token ${patient.tokenNumber}.` });
        // In a real app, this would trigger TTS again.
    }

    const onViewHistory = (patient: Patient) => {
        setHistoryPatient(patient);
    }

    const getQueueCountForGroup = (groupId: string) => {
      return (allPatients || []).filter(p => p.groupId === groupId && p.status === 'waiting').length;
    }

    const activePatients = (allPatients || []).filter(p => p.status === 'waiting' || p.status === 'calling' || p.status === 'consulting');
    const totalPatients = activePatients.length;
    const waitingPatients = (allPatients || []).filter(p => p.status === 'waiting');
    const inQueue = waitingPatients.length;
    const attendedToday = (allPatients || []).filter(p => p.groupId === selectedGroupId && p.status === 'consultation-done').length;
    const noShowsToday = (allPatients || []).filter(p => p.groupId === selectedGroupId && p.status === 'no-show').length;


    const stats = [
    { title: 'TOTAL ACTIVE', value: totalPatients, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'IN QUEUE', value: inQueue, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'ATTENDED TODAY', value: attendedToday, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { title: 'NO SHOWS TODAY', value: noShowsToday, icon: XCircle, color: 'bg-red-100 text-red-600' },
    ];
  
    const nextToken = waitingPatients.length > 0
    ? [...waitingPatients].sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime())[0].tokenNumber
    : undefined;

    const isLoading = patientsLoading || cabinsLoading;

    if (!selectedGroup) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Select a group to begin.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
            <Card key={stat.title}>
                <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-semibold">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
        
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-wrap">
                {groups.map(group => (
                    <Button 
                        key={group.id} 
                        variant={selectedGroupId === group.id ? 'default' : 'ghost'}
                        onClick={() => setSelectedGroupId(group.id)}
                    >
                        {group.name} 
                        <Badge className="ml-2" variant={selectedGroupId === group.id ? 'secondary' : 'default'}>{getQueueCountForGroup(group.id)}</Badge>
                    </Button>
                ))}
            </div>
            <div className="flex items-center gap-4">
                {nextToken && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">NEXT:</span>
                        <Badge variant="outline" className="text-base font-bold border-primary text-primary">{nextToken}</Badge>
                    </div>
                )}
                <Button onClick={() => setCheckInModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Manual Register
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
                [...Array(selectedGroup.cabins.length || 4)].map((_, i) => (
                    <Card key={i}><CardContent className="p-4 h-52 flex items-center justify-center"><Loader className="animate-spin"/></CardContent></Card>
                ))
            ) : selectedGroup.cabins.map(cabinRef => {
                const cabin = liveCabins?.find(c => c.id === cabinRef.id);
                if (!cabin) return null; // or a loading state for individual cabin
                const patientForRoom = cabin.patientInCabinId ? (allPatients || []).find(p => p.id === cabin.patientInCabinId) : null;
                return (
                    <RoomCard 
                        key={cabin.id}
                        doctorId={doctorId}
                        cabin={cabin}
                        patient={patientForRoom || null}
                        onAssignDoctor={handleAssignDoctorToRoom}
                        onCallNext={handleCallNextPatient}
                        onLeave={handleLeaveRoom}
                        onAction={handleRoomAction}
                        onCallPatient={handleCallPatient}
                        onViewHistory={onViewHistory}
                        onRevertPatient={handleRevertPatient}
                    />
                )
            })}
        </div>
        <VisitHistoryModal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} patient={historyPatient} />
        <ManualCheckInModal 
            isOpen={isCheckInModalOpen}
            onClose={closeCheckInModal}
            groups={groups}
            onPatientRegistered={onPatientRegistered}
        />
        </div>
    );
}
