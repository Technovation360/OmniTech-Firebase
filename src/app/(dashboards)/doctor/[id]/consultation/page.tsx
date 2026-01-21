
'use client';

import { useState, useEffect, use, useMemo, useCallback } from 'react';
import type { Patient, Group, User, PatientHistoryEntry, Consultation, Cabin, PatientTransaction, PatientMaster, EnrichedPatient } from '@/lib/types';
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
  Stethoscope,
  PlusCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handlePatientAction } from '@/lib/actions';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, Timestamp, documentId, setDoc } from 'firebase/firestore';
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
import { Label } from '@/components/ui/label';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Textarea } from '@/components/ui/textarea';


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


function AddNotesModal({
  isOpen,
  onClose,
  patient,
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (patient) {
      setNotes(patient.notes || '');
    }
  }, [patient]);

  if (!patient) return null;

  const handleSave = () => {
    if (!notes.trim()) {
      toast({ variant: 'destructive', title: 'Notes cannot be empty.' });
      return;
    }
    const patientDocRef = doc(firestore, 'patient_transactions', patient.id);
    setDocumentNonBlocking(patientDocRef, { notes }, { merge: true });
    toast({ title: 'Notes saved.' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Add Consultation Notes for {patient.name}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <Label htmlFor="notes" className="mb-2 block font-semibold text-muted-foreground">Consultation Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            placeholder="Enter your notes here..."
          />
        </div>
        <DialogFooter className="bg-muted/50 px-6 py-4 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Notes</Button>
        </DialogFooter>
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
      getPatientHistory(patient.id).then(setHistory);
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
               {history.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
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
    onAddNotes,
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
    onAddNotes: (patient: Patient) => void,
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
                    <Button size="xs" className="bg-green-600 hover:bg-green-700" onClick={() => onAssignDoctor(cabin.id)}>
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
    if (!cabin.patientInCabinId) {
        // After consultation, show "Call Next" and "Leave"
         return (
            <Card>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                    <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-green-100 rounded-full mb-2">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mb-4">ROOM AVAILABLE</p>
                    <div className="flex flex-col gap-2 w-full">
                       <Button size="xs" onClick={() => onCallNext(cabin.id)}>
                           <PhoneCall className="mr-2 h-4 w-4"/>
                           Call Next
                       </Button>
                        <Button variant="destructive" size="xs" onClick={() => onLeave(cabin.id)}>
                            <LogOut className="mr-1 h-3 w-3" />
                            Leave
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                 <Button variant="destructive" size="xs" className="h-7" onClick={() => onLeave(cabin.id)}>
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
                       <Button size="xs" onClick={() => onCallNext(cabin.id)}>
                           <PhoneCall className="mr-2 h-4 w-4"/>
                           Call Next
                       </Button>
                   </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-between">
                         <div className="text-center">
                            <p className="font-bold text-4xl text-primary">{patient.tokenNumber}</p>
                            <p className="font-semibold">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.age} / {patient.gender?.charAt(0).toUpperCase()}</p>
                        </div>
                        {patient.status === 'consulting' ? (
                             <div className="grid grid-cols-2 gap-2 w-full">
                                <Button size="xs" className="bg-red-500 hover:bg-red-600 col-span-2" onClick={() => onAction(patient!.id, cabin.id, 'end')}>
                                    <Square className="mr-2 h-4 w-4"/> End
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => onAddNotes(patient!)}>
                                    <FileText className="mr-2 h-4 w-4"/> Notes
                                </Button>
                                <Button size="xs" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                                    <History className="mr-2 h-4 w-4"/> History
                                </Button>
                            </div>
                        ) : ( // 'calling' status
                             <div className="grid grid-cols-2 gap-2 w-full">
                                <Button size="xs" className="bg-primary hover:bg-primary/90" onClick={() => onAction(patient!.id, cabin.id, 'start')}>
                                    <Play className="mr-2 h-3 w-3"/> Start
                                </Button>
                                <Button size="xs" variant="outline" disabled={!noShowEnabled} onClick={() => onAction(patient!.id, cabin.id, 'no-show')} className={cn('text-xs', noShowEnabled && 'text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive')}>
                                    { !noShowEnabled ? (
                                        <span className="text-xs font-mono w-full text-center">No Show ({timer}s)</span>
                                    ) : (
                                        <><UserX className="mr-2 h-3 w-3"/> No Show</>
                                    )}
                                </Button>
                                <Button size="xs" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onCallPatient(patient)}>
                                    <PhoneCall className="mr-2 h-3 w-3"/> Re-Call
                                 </Button>
                                 <Button size="xs" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                                    <History className="mr-2 h-3 w-3"/> History
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
  const resolvedParams = use(params);
  const { id } = resolvedParams;
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

    const doctorUserRef = useMemoFirebase(() => {
        return doc(firestore, 'users', doctorId);
    }, [firestore, doctorId]);
    const { data: doctorUser } = useDoc<User>(doctorUserRef);
    
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id);
    const { toast } = useToast();
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
    const [notesPatient, setNotesPatient] = useState<Patient | null>(null);

    const [refetchIndex, setRefetchIndex] = useState(0);
    const refetchPatients = useCallback(() => setRefetchIndex(p => p + 1), []);

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    
    const groupIds = useMemo(() => groups.map(g => g.id), [groups]);
    const patientTransactionsQuery = useMemoFirebase(() => {
        if (groupIds.length === 0) return null;
        return query(collection(firestore, 'patient_transactions'), where('groupId', 'in', groupIds));
    }, [firestore, groupIds, refetchIndex]);

    const { data: patientTransactions, isLoading: patientsLoading } = useCollection<PatientTransaction>(patientTransactionsQuery);
    
    const contactNumbers = useMemo(() => {
        if (!patientTransactions) return [];
        return [...new Set(patientTransactions.map(p => p.contactNumber).filter(Boolean))];
    }, [patientTransactions]);
    
    const patientMastersQuery = useMemoFirebase(() => {
        if (contactNumbers.length === 0) return null;
        // Firestore 'in' query supports up to 30 elements. Chunking is needed for more.
        return query(collection(firestore, 'patient_master'), where('contactNumber', 'in', contactNumbers.slice(0, 30)));
    }, [firestore, contactNumbers]);
    
    const { data: patientMasters, isLoading: mastersLoading } = useCollection<PatientMaster>(patientMastersQuery);

    const allPatients = useMemo<EnrichedPatient[]>(() => {
        if (!patientTransactions || !patientMasters) return [];
        const mastersMap = new Map(patientMasters.map(m => [m.contactNumber, m]));
        return patientTransactions.map(t => {
            const master = mastersMap.get(t.contactNumber);
            if (!master) return null;
            return { ...master, ...t };
        }).filter((p): p is EnrichedPatient => p !== null);
    }, [patientTransactions, patientMasters]);
    
    const cabinIds = useMemo(() => selectedGroup?.cabins.map(c => c.id) || [], [selectedGroup]);
    const cabinsQuery = useMemoFirebase(() => {
        if (cabinIds.length === 0) return null;
        return query(collection(firestore, 'cabins'), where('__name__', 'in', cabinIds));
    }, [firestore, cabinIds]);
    const { data: liveCabins, isLoading: cabinsLoading } = useCollection<Cabin>(cabinsQuery);


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
        const waitingPatients = (allPatients || []).filter(p => p.status === 'waiting' && p.groupId === selectedGroupId).sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
        if (waitingPatients.length === 0) {
            toast({ variant: 'destructive', title: "No patients in queue", description: "There are no patients waiting." });
            return;
        }
        const nextPatient = waitingPatients[0];

        // DB Update
        const patientDocRef = doc(firestore, 'patient_transactions', nextPatient.id);
        const cabinDocRef = doc(firestore, 'cabins', cabinId);

        setDocumentNonBlocking(patientDocRef, { status: 'calling', cabinId: cabinId }, { merge: true });
        setDocumentNonBlocking(cabinDocRef, { patientInCabinId: nextPatient.id }, { merge: true });
        
        toast({ title: "Patient Called", description: `${nextPatient.name} has been called.`});
        refetchPatients();
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
            setDocumentNonBlocking(patientDocRef, { status: 'consulting', consultingStartTime: new Date().toISOString() }, { merge: true });
            toast({ title: `Consultation Started` });
        } else if (action === 'end') {
            setDocumentNonBlocking(patientDocRef, { status: 'consultation-done', consultingEndTime: new Date().toISOString() }, { merge: true });
            setDocumentNonBlocking(cabinDocRef, { patientInCabinId: null }, { merge: true });
            toast({ title: `Consultation Ended` });
        } else if (action === 'no-show') {
            setDocumentNonBlocking(patientDocRef, { status: 'no-show', cabinId: null, consultingEndTime: new Date().toISOString() }, { merge: true });
            setDocumentNonBlocking(cabinDocRef, { patientInCabinId: null }, { merge: true });
            toast({ title: `Patient marked as No Show` });
        }
        refetchPatients();
    };

    const handleCallPatient = (patient: Patient) => {
        toast({ title: `Calling ${patient.name}`, description: `Re-announcing token ${patient.tokenNumber}.` });
        // In a real app, this would trigger TTS again.
    }

    const handleAddNotes = (patient: Patient) => {
        setNotesPatient(patient);
    };

    const onViewHistory = (patient: Patient) => {
        setHistoryPatient(patient);
    }

    const getQueueCountForGroup = (groupId: string) => {
      return (allPatients || []).filter(p => p.groupId === groupId && p.status === 'waiting').length;
    }
    
    const waitingPatients = allPatients.filter(p => p.groupId === selectedGroupId && p.status === 'waiting');
  
    const nextToken = waitingPatients.length > 0
    ? [...waitingPatients].sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime())[0].tokenNumber
    : undefined;

    const isLoading = patientsLoading || mastersLoading || cabinsLoading;

    if (!selectedGroup) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Select a group to begin.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
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
                        onAddNotes={handleAddNotes}
                    />
                )
            })}
        </div>
        <VisitHistoryModal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} patient={historyPatient} />
        <AddNotesModal 
            isOpen={!!notesPatient}
            onClose={() => setNotesPatient(null)}
            patient={notesPatient}
        />
        </div>
    );
}

    