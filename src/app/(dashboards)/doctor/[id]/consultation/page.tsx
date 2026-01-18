
'use client';

import { useState, useEffect, use, useMemo } from 'react';
import type { Patient, Group, User, PatientHistoryEntry, Consultation } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  LogOut as LeaveIcon,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handlePatientAction } from '@/lib/actions';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
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


type DoctorPageProps = {
  params: { id: string };
};

type RoomStatus = {
    name: string; // Cabin name
    patientId: string | null;
    status: 'vacant' | 'occupied' | 'post-consultation';
}

const badgeColors: Record<Patient['status'], string> = {
  waiting: 'bg-blue-100 text-blue-800',
  called: 'bg-orange-100 text-orange-800',
  'in-consultation': 'bg-green-100 text-green-800',
  'consultation-done': 'bg-gray-100 text-gray-800',
  'no-show': 'bg-red-100 text-red-800',
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
    cabin, 
    room, 
    patient, 
    onAssign, 
    onLeave, 
    onAction,
    onViewHistory,
    onCallPatient 
}: { 
    cabin: any, 
    room: RoomStatus, 
    patient: Patient | null, 
    onAssign: (roomName: string) => void,
    onLeave: (roomName: string) => void,
    onAction: (patientId: string, roomName: string, action: 'start' | 'end' | 'no-show') => void,
    onViewHistory: (patient: Patient) => void,
    onCallPatient: (patient: Patient) => void,
}) {
    const [noShowEnabled, setNoShowEnabled] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let timerId: NodeJS.Timeout | undefined;
        let countdownInterval: NodeJS.Timeout | undefined;

        if (patient && patient.status === 'called') {
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


    if (room.status === 'post-consultation') {
        return (
            <Card>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                    <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                    <p className="font-semibold mb-4">Consultation Ended</p>
                    <Button onClick={() => onAssign(cabin.name)}>Call Next Patient</Button>
                </CardContent>
            </Card>
        );
    }
    
    if (!patient) { // Vacant
        return (
             <Card>
                <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                    <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                    <Button size="xs" className="bg-green-600 hover:bg-green-700 h-7" onClick={() => onAssign(cabin.name)}>ASSIGN</Button>
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

    // Occupied states
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30 h-[53px]">
                <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                <Button variant="destructive" size="xs" className="h-7" onClick={() => onLeave(cabin.name)}>
                    <LeaveIcon className="mr-1 h-3 w-3" />
                    Leave
                </Button>
            </CardHeader>
            <CardContent className="p-4 h-48 flex flex-col items-center justify-between text-center">
                {/* Patient Info */}
                <div className="text-center">
                    <p className="font-bold text-4xl text-primary">{patient.tokenNumber}</p>
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.age} / {patient.gender.charAt(0).toUpperCase()}</p>
                </div>
                {/* Action buttons */}
                {patient.status === 'in-consultation' ? (
                     <div className="grid grid-cols-2 gap-2 w-full">
                        <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => onAction(patient!.id, cabin.name, 'end')}>
                            <Square className="mr-2 h-4 w-4"/> End
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => useToast().toast({ title: 'Add Notes', description: 'This would open a notes editor.' })}>
                            <FileText className="mr-2 h-4 w-4"/> Add Notes
                        </Button>
                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => onCallPatient(patient)}>
                            <PhoneCall className="mr-2 h-4 w-4"/> Call Patient
                        </Button>
                         <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onViewHistory(patient)}>
                            <History className="mr-2 h-4 w-4"/> History
                        </Button>
                    </div>
                ) : ( // 'called' status
                     <div className="grid grid-cols-2 gap-2 w-full">
                        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => onAction(patient!.id, cabin.name, 'start')}>
                            <Play className="mr-2 h-4 w-4"/> Start
                        </Button>
                        <Button size="sm" variant="outline" disabled={!noShowEnabled} onClick={() => onAction(patient!.id, cabin.name, 'no-show')} className={cn(noShowEnabled && 'text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive')}>
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
  const groupIds = useMemo(() => doctorGroups?.map(g => g.id) || [], [doctorGroups]);

  const patientsQuery = useMemoFirebase(() => {
    if (groupIds.length === 0) return null;
    return query(collection(firestore, 'patients'), where('groupId', 'in', groupIds));
  }, [firestore, groupIds]);
  const { data: allPatients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);
  
  if (doctorUserLoading || groupsLoading || patientsLoading) {
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

  return <DoctorConsultationDashboard doctorId={id} groups={doctorGroups} allPatients={allPatients || []} />;
}


function DoctorConsultationDashboard({
  doctorId,
  groups,
  allPatients,
}: {
  doctorId: string,
  groups: Group[];
  allPatients: Patient[];
}) {
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id);
    const { toast } = useToast();
    const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    
    const [patients, setPatients] = useState<Patient[]>([]);
    const [rooms, setRooms] = useState<RoomStatus[]>([]);

    useEffect(() => {
        const patientsForGroup = allPatients.filter(p => p.groupId === selectedGroupId);
        setPatients(patientsForGroup);

        if (selectedGroup) {
            setRooms(prevRooms => {
                const newRooms = selectedGroup.cabins.map(cabin => {
                    const existingRoom = prevRooms.find(r => r.name === cabin.name);
                    if (existingRoom) {
                        const patientStillActive = patientsForGroup.some(p => p.id === existingRoom.patientId && (p.status === 'called' || p.status === 'in-consultation'));
                        if (patientStillActive) {
                            return { ...existingRoom, status: 'occupied' };
                        }
                         if (existingRoom.status === 'post-consultation') {
                            return existingRoom;
                        }
                    }
                    return { name: cabin.name, patientId: null, status: 'vacant' };
                });
                return newRooms;
            });
        }
    }, [allPatients, selectedGroupId, selectedGroup]);


    const handleAssignRoom = (roomName: string) => {
        const nextPatient = patients.find(p => p.status === 'waiting');
        if (!nextPatient) {
            toast({
                variant: 'destructive',
                title: "No patients in queue",
                description: "There are no patients waiting to be assigned.",
            });
            return;
        }

        setPatients(prev => prev.map(p => p.id === nextPatient.id ? {...p, status: 'called'} : p));
        setRooms(prev => prev.map(room => room.name === roomName ? { ...room, patientId: nextPatient.id, status: 'occupied' } : room));
        
        handlePatientAction(nextPatient.id, 'call');
        
        toast({
            title: "Patient Assigned",
            description: `${nextPatient.name} has been assigned to ${roomName}.`,
        });
    };
    
    const handleRoomAction = (patientId: string, roomName: string, action: 'start' | 'end' | 'no-show') => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        if (action === 'start') {
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: 'in-consultation' } : p));
        } else {
            const newStatus = action === 'end' ? 'consultation-done' : 'no-show';
            setPatients(prev => prev.filter(p => p.id !== patientId)); // Remove from active queue
            setRooms(prev => prev.map(room => room.name === roomName ? { ...room, patientId: null, status: 'post-consultation' } : room));
        }
        
        handlePatientAction(patientId, action);

        toast({
            title: `Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            description: `Patient ${patient.name} status updated.`,
        });
    };

    const handleLeaveRoom = (roomName: string) => {
        const room = rooms.find(r => r.name === roomName);
        if (!room || !room.patientId) return;
        const patientId = room.patientId;

        setPatients(prev => prev.map(p => p.id === patientId ? {...p, status: 'waiting'} : p));
        setRooms(prev => prev.map(r => r.name === roomName ? { ...r, patientId: null, status: 'vacant' } : r));

        handlePatientAction(patientId, 'call-revert'); // A special action to revert status
        toast({ title: 'Room Vacated', description: 'Patient sent back to the waiting queue.' });
    }

    const handleCallPatient = (patient: Patient) => {
        toast({ title: `Calling ${patient.name}`, description: `Re-announcing token ${patient.tokenNumber}.` });
        // In a real app, this would trigger TTS again.
    }

    const onViewHistory = (patient: Patient) => {
        setHistoryPatient(patient);
    }

  const getQueueCountForGroup = (groupId: string) => {
      return allPatients.filter(p => p.groupId === groupId && p.status === 'waiting').length;
  }

  const activePatients = patients.filter(p => p.status === 'waiting' || p.status === 'called' || p.status === 'in-consultation');
  const totalPatients = activePatients.length;
  const inQueue = activePatients.filter(p => p.status === 'waiting').length;
  const attendedToday = allPatients.filter(p => p.groupId === selectedGroupId && p.status === 'consultation-done').length;
  const noShowsToday = allPatients.filter(p => p.groupId === selectedGroupId && p.status === 'no-show').length;


  const stats = [
    { title: 'TOTAL ACTIVE', value: totalPatients, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'IN QUEUE', value: inQueue, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'ATTENDED TODAY', value: attendedToday, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { title: 'NO SHOWS TODAY', value: noShowsToday, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];
  
  const nextToken = patients.find(p => p.status === 'waiting')?.tokenNumber;

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
        {nextToken && (
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">NEXT:</span>
                <Badge variant="outline" className="text-base font-bold border-primary text-primary">{nextToken}</Badge>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {selectedGroup.cabins.map(cabin => {
            const room = rooms.find(r => r.name === cabin.name);
            if (!room) return null;
            const patientForRoom = room?.patientId ? allPatients.find(p => p.id === room.patientId) : null;
            return (
                <RoomCard 
                    key={cabin.id}
                    cabin={cabin}
                    room={room}
                    patient={patientForRoom || null}
                    onAssign={handleAssignRoom}
                    onLeave={handleLeaveRoom}
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
