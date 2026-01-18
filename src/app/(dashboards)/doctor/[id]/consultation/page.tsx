
'use client';

import { useState, useEffect, use, useMemo } from 'react';
import type { Patient, Group, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handlePatientAction } from '@/lib/actions';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

type DoctorPageProps = {
  params: { id: string };
};

type RoomStatus = {
    name: string;
    patientId: string | null;
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

function RoomCard({ cabin, room, patient, onAssign, onAction }: { cabin: any, room: RoomStatus | undefined, patient: Patient | null, onAssign: (roomName: string) => void, onAction: (patientId: string, roomName: string, action: 'start' | 'end' | 'no-show') => void }) {
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

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30">
                <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                {!patient && <Button size="xs" className="bg-green-600 hover:bg-green-700 h-7" onClick={() => onAssign(cabin.name)}>ASSIGN</Button>}
            </CardHeader>
            <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
            {!patient ? (
                <>
                    <div className="p-3 bg-yellow-100 rounded-full mb-2">
                        <Lock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">ASSIGN ROOM</p>
                </>
            ) : (
                <div className="flex flex-col items-center justify-between h-full w-full">
                <div className="text-center">
                        <p className="font-bold text-4xl text-primary">{patient.tokenNumber}</p>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.age} / {patient.gender.charAt(0).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-2 w-full">
                    {patient.status !== 'in-consultation' ? (
                        <Button size="sm" className="flex-1" onClick={() => onAction(patient!.id, cabin.name, 'start')}>
                            <Play className="mr-2 h-4 w-4"/> Start
                        </Button>
                    ) : (
                        <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600" onClick={() => onAction(patient!.id, cabin.name, 'end')}>
                            <Square className="mr-2 h-4 w-4"/> End
                        </Button>
                    )}
                    <Button size="icon" variant="outline" disabled={!noShowEnabled && patient.status === 'called'} onClick={() => onAction(patient!.id, cabin.name, 'no-show')}>
                        {patient?.status === 'called' && !noShowEnabled ? (
                           <span className="text-xs font-mono w-4 text-center">{timer}</span>
                        ) : (
                           <UserX className="h-4 w-4 text-destructive"/>
                        )}
                    </Button>
                </div>
                </div>
            )}
            </CardContent>
        </Card>
    );
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

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    
    // This state will hold the patients for the currently selected group, used for optimistic UI updates
    const [patients, setPatients] = useState<Patient[]>([]);
    
    const [rooms, setRooms] = useState<RoomStatus[]>([]);

    useEffect(() => {
        // When allPatients from firestore updates, reset our local patient state
        const patientsForGroup = allPatients.filter(p => p.groupId === selectedGroupId);
        setPatients(patientsForGroup);

        // Also clean up rooms for patients that are no longer active
        if (selectedGroup) {
            setRooms(prevRooms => {
                return selectedGroup.cabins.map(cabin => {
                    const existingRoom = prevRooms.find(r => r.name === cabin.name);
                    if (existingRoom && existingRoom.patientId) {
                        const patientStillActive = patientsForGroup.some(p => p.id === existingRoom.patientId && (p.status === 'called' || p.status === 'in-consultation'));
                        if (patientStillActive) {
                            return existingRoom;
                        }
                    }
                    return { name: cabin.name, patientId: null };
                });
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

        // Optimistic update of local patients state
        setPatients(prev => prev.map(p => p.id === nextPatient.id ? {...p, status: 'called'} : p));
        setRooms(prev => prev.map(room => room.name === roomName ? { ...room, patientId: nextPatient.id } : room));
        
        // Actual DB update
        handlePatientAction(nextPatient.id, 'call');
        
        toast({
            title: "Patient Assigned",
            description: `${nextPatient.name} has been assigned to ${roomName}.`,
        });
    };
    
    const handleRoomAction = (patientId: string, roomName: string, action: 'start' | 'end' | 'no-show') => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        // Optimistic update
        if (action === 'start') {
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: 'in-consultation' } : p));
        } else {
            const newStatus = action === 'end' ? 'consultation-done' : 'no-show';
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: newStatus } : p));
            setRooms(prev => prev.map(room => room.name === roomName ? { ...room, patientId: null } : room));
        }
        
        // Actual DB update
        handlePatientAction(patientId, action);

        toast({
            title: `Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            description: `Patient ${patient.name} status updated.`,
        });
    };

  const getQueueCountForGroup = (groupId: string) => {
      return allPatients.filter(p => p.groupId === groupId && p.status === 'waiting').length;
  }

  const totalPatients = patients.length;
  const inQueue = patients.filter(p => p.status === 'waiting').length;
  const attended = patients.filter(p => p.status === 'consultation-done').length;
  const noShows = patients.filter(p => p.status === 'no-show').length;

  const stats = [
    { title: 'TOTAL PATIENTS', value: totalPatients, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'IN QUEUE', value: inQueue, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'ATTENDED', value: attended, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { title: 'NO SHOWS', value: noShows, icon: XCircle, color: 'bg-red-100 text-red-600' },
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
            const patientForRoom = room?.patientId ? patients.find(p => p.id === room.patientId) : null;
            return (
                <RoomCard 
                    key={cabin.id}
                    cabin={cabin}
                    room={room}
                    patient={patientForRoom}
                    onAssign={handleAssignRoom}
                    onAction={handleRoomAction}
                />
            )
        })}
      </div>
    </div>
  );
}
