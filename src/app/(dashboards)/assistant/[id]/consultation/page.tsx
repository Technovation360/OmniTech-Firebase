
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


type AssistantPageProps = {
  params: Promise<{ id: string }>;
};

const badgeColors: Record<Patient['status'], string> = {
  'waiting': "bg-blue-100 text-blue-800",
  'calling': "bg-orange-100 text-orange-800",
  'consulting': "bg-green-100 text-green-800",
  'consultation-done': "bg-gray-100 text-gray-800",
  'no-show': "bg-red-100 text-red-800",
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
    cabin, 
    patient, 
    onCallNext,
    onAction,
    onViewHistory,
    onCallPatient,
}: { 
    cabin: Cabin, 
    patient: Patient | null, 
    onCallNext: (cabinId: string) => void,
    onAction: (patientId: string, cabinId: string, action: 'no-show') => void,
    onViewHistory: (patient: Patient) => void,
    onCallPatient: (patient: Patient) => void,
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
                    <p className="text-sm font-semibold text-muted-foreground">ROOM VACANT</p>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                <Badge variant="outline" className="text-xs">Dr. {cabin.assignedDoctorName}</Badge>
            </CardHeader>
            <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                { !patient ? (
                     <>
                        <div className="p-3 bg-blue-100 rounded-full mb-2">
                           <Stethoscope className="h-6 w-6 text-blue-500" />
                       </div>
                       <p className="text-sm font-semibold text-muted-foreground mb-4">ROOM AVAILABLE</p>
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
                             <div className="grid grid-cols-1 gap-2 w-full">
                                <Button size="xs" variant="outline" disabled>
                                    <Square className="mr-2 h-4 w-4"/> Consulting
                                </Button>
                                <Button size="xs" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                                    <History className="mr-2 h-4 w-4"/> History
                                </Button>
                            </div>
                        ) : ( // 'calling' status
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button size="xs" variant="outline" disabled>
                                    Waiting
                                </Button>
                                <Button size="xs" variant="outline" disabled={!noShowEnabled} onClick={() => onAction(patient!.id, cabin.id, 'no-show')} className={cn('text-xs', noShowEnabled && 'text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive')}>
                                    { !noShowEnabled ? (
                                        <span className="text-xs font-mono w-full text-center">No Show</span>
                                    ) : (
                                        "No Show"
                                    )}
                                </Button>
                                <Button size="xs" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onCallPatient(patient)}>
                                    Re-Call
                                 </Button>
                                 <Button size="xs" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                                     History
                                 </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


export default function AssistantConsultationPageLoader({ params }: AssistantPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const firestore = useFirestore();
  
  const assistantUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: assistantUser, isLoading: assistantUserLoading } = useDoc<User>(assistantUserRef);
  
  const assistantGroupsQuery = useMemoFirebase(() => {
    if (!assistantUser) return null;
    return query(collection(firestore, "groups"), where("assistants", "array-contains", { id: id, name: assistantUser.name }));
  }, [firestore, id, assistantUser]);

  const {data: assistantGroups, isLoading: groupsLoading} = useCollection<Group>(assistantGroupsQuery);
  
  if (assistantUserLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!assistantGroups || assistantGroups.length === 0) {
       return (
         <div className="flex items-center justify-center h-full">
            <p>Could not load assistant's dashboard. Ensure assistant is assigned to a group.</p>
        </div>
       )
  }

  return <AssistantConsultationDashboard assistantId={id} groups={assistantGroups} />;
}


function AssistantConsultationDashboard({
  assistantId,
  groups,
}: {
  assistantId: string,
  groups: Group[];
}) {
    const firestore = useFirestore();
    
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id);
    const { toast } = useToast();
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);

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


    const handleCallNextPatient = (cabinId: string) => {
        const waitingPatients = (allPatients || []).filter(p => p.status === 'waiting' && p.groupId === selectedGroupId).sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
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
        refetchPatients();
    };
    
    const handleRoomAction = (patientId: string, cabinId: string, action: 'no-show') => {
        const patientDocRef = doc(firestore, 'patient_transactions', patientId);
        const cabinDocRef = doc(firestore, 'cabins', cabinId);

        if (action === 'no-show') {
            setDocumentNonBlocking(patientDocRef, { status: 'no-show', cabinId: null, consultingEndTime: new Date().toISOString() }, { merge: true });
            setDocumentNonBlocking(cabinDocRef, { patientInCabinId: null }, { merge: true });
            toast({ title: `Patient marked as No Show` });
        }
        refetchPatients();
    };

    const handleCallPatient = (patient: Patient) => {
        toast({ title: `Calling ${patient.name}`, description: `Re-announcing token ${patient.tokenNumber}.` });
    }

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
                if (!cabin) return null;
                const patientForRoom = cabin.patientInCabinId ? (allPatients || []).find(p => p.id === cabin.patientInCabinId) : null;
                return (
                    <RoomCard 
                        key={cabin.id}
                        cabin={cabin}
                        patient={patientForRoom || null}
                        onCallNext={handleCallNextPatient}
                        onAction={handleRoomAction}
                        onCallPatient={handleCallPatient}
                        onViewHistory={onViewHistory}
                    />
                )
            })}
        </div>
        <VisitHistoryModal isOpen={!!historyPatient} onClose={() => setHistoryPatient(null)} patient={historyPatient} />
        </div>
    );
}

    

