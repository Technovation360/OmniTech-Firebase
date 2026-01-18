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
    patient: Patient | null;
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

  return <DoctorConsultationDashboard groups={doctorGroups} allPatients={allPatients || []} />;
}


function DoctorConsultationDashboard({
  groups,
  allPatients,
}: {
  groups: Group[];
  allPatients: Patient[];
}) {
    const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id);
    const { toast } = useToast();

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    
    // This state will hold the patients for the currently selected group
    const [patients, setPatients] = useState<Patient[]>([]);
    
    // This state holds all room assignments across all groups, but we only display rooms for the selected group
    const [rooms, setRooms] = useState<RoomStatus[]>([]);

     useEffect(() => {
        const newPatientsForGroup = allPatients.filter(p => p.groupId === selectedGroupId);
        setPatients(newPatientsForGroup);

        if (selectedGroup) {
            // Only update/set rooms for the selected group
            setRooms(prevRooms => {
                const existingRoomsForGroup = prevRooms.filter(r => selectedGroup.cabins.some(c => c.name === r.name));
                const newCabins = selectedGroup.cabins.filter(c => !existingRoomsForGroup.some(er => er.name === c.name));
                
                return [
                    ...existingRoomsForGroup,
                    ...newCabins.map(cabin => ({ name: cabin.name, patient: null }))
                ];
            });
        }
    }, [selectedGroupId, allPatients, groups, selectedGroup]);


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

        setRooms(prevRooms => prevRooms.map(room => room.name === roomName ? { ...room, patient: nextPatient } : room));
        // Update local patient state for immediate UI feedback
        setPatients(prevPatients => prevPatients.map(p => p.id === nextPatient.id ? { ...p, status: 'called' } : p));

        handlePatientAction(nextPatient.id, 'call');
        
        toast({
            title: "Patient Assigned",
            description: `${nextPatient.name} has been assigned to ${roomName}.`,
        });
    };
    
    const handleRoomAction = (patientId: string, roomName: string, action: 'start' | 'end' | 'no-show') => {
        handlePatientAction(patientId, action);
        
        const patient = allPatients.find(p => p.id === patientId);
        
        if (action === 'start') {
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: 'in-consultation' } : p));
        } else {
            setRooms(prev => prev.map(room => room.name === roomName ? { ...room, patient: null } : room));
            const newStatus = action === 'end' ? 'consultation-done' : 'no-show';
            setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: newStatus } : p));
        }

        toast({
            title: `Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            description: `Patient ${patient?.name} status updated.`,
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
            return (
                 <Card key={cabin.id}>
                    <CardHeader className="flex-row items-center justify-between p-3 border-b bg-muted/30">
                        <CardTitle className="text-sm font-semibold">{cabin.name.toUpperCase()}</CardTitle>
                        {!room?.patient && <Button size="xs" className="bg-green-600 hover:bg-green-700 h-7" onClick={() => handleAssignRoom(cabin.name)}>ASSIGN</Button>}
                    </CardHeader>
                    <CardContent className="p-4 h-48 flex flex-col items-center justify-center text-center">
                    {!room?.patient ? (
                        <>
                            <div className="p-3 bg-yellow-100 rounded-full mb-2">
                                <Lock className="h-6 w-6 text-yellow-500" />
                            </div>
                            <p className="text-sm font-semibold text-muted-foreground">ASSIGN ROOM</p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-between h-full w-full">
                        <div className="text-center">
                                <p className="font-bold text-4xl text-primary">{room.patient.tokenNumber}</p>
                                <p className="font-semibold">{room.patient.name}</p>
                                <p className="text-sm text-muted-foreground">{room.patient.age} / {room.patient.gender.charAt(0).toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                            {room.patient.status !== 'in-consultation' ? (
                                <Button size="sm" className="flex-1" onClick={() => handleRoomAction(room.patient!.id, cabin.name, 'start')}>
                                    <Play className="mr-2 h-4 w-4"/> Start
                                </Button>
                            ) : (
                                <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600" onClick={() => handleRoomAction(room.patient!.id, cabin.name, 'end')}>
                                    <Square className="mr-2 h-4 w-4"/> End
                                </Button>
                            )}
                            <Button size="icon" variant="outline" onClick={() => handleRoomAction(room.patient!.id, cabin.name, 'no-show')}>
                                <UserX className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        </div>
                    )}
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
