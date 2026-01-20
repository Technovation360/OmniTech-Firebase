
'use client';

import { use, useState, useEffect, useMemo } from 'react';
import type { Patient, Group, Doctor, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Clock,
  CheckSquare,
  XCircle,
  Loader,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';


type DoctorPageProps = {
  params: { id: string };
};


export default function DoctorPageLoader({ params }: DoctorPageProps) {
  const { id } = use(params);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const doctorUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: doctorUser, isLoading: doctorUserLoading } = useDoc<User>(doctorUserRef);

  const doctorGroupsQuery = useMemoFirebase(() => {
    if (!doctorUser) return null;
    return query(collection(firestore, "groups"), where("doctors", "array-contains", { id: id, name: doctorUser.name }));
  }, [firestore, id, doctorUser]);

  const {data: doctorGroups, isLoading: groupsLoading} = useCollection<Group>(doctorGroupsQuery);

  if (isUserLoading || doctorUserLoading || groupsLoading) {
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

  return (
    <DoctorDashboard
      doctorId={id}
      groups={doctorGroups}
    />
  );
}

function DoctorDashboard({
  doctorId,
  groups,
}: {
  doctorId: string;
  groups: Group[];
}) {
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const firestore = useFirestore();
  const doctor = groups.flatMap(g => g.doctors).find(d => d.id === doctorId);

  const groupIds = useMemo(() => groups.map(g => g.id), [groups]);

  const allPatientsQuery = useMemoFirebase(() => {
    if (groupIds.length === 0) return null;
    return query(collection(firestore, 'patient_transactions'), where('groupId', 'in', groupIds));
  }, [firestore, groupIds]);
  const { data: allPatients, isLoading: patientsLoading } = useCollection<Patient>(allPatientsQuery);

  const filteredPatients = useMemo(() => {
    if (!allPatients) return [];
    if (selectedGroupId === 'all') {
      return allPatients;
    }
    return allPatients.filter(p => p.groupId === selectedGroupId);
  }, [allPatients, selectedGroupId]);

  const totalPatients = filteredPatients.length;
  const inQueue = filteredPatients.filter(p => p.status === 'waiting' || p.status === 'calling').length;
  const attended = filteredPatients.filter(p => p.status === 'consultation-done').length;
  const noShows = filteredPatients.filter(p => p.status === 'no-show').length;

  const stats = [
    { title: 'TOTAL PATIENTS', value: totalPatients, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'IN QUEUE', value: inQueue, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'ATTENDED', value: attended, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { title: 'NO SHOWS', value: noShows, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];

  const waitingPatients = allPatients ? allPatients.filter(p => p.status === 'waiting') : [];
  const nextToken = waitingPatients.length > 0
    ? [...waitingPatients].sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime())[0]
    : undefined;
  
  if (!doctor) {
    return <p>Doctor not found in this group.</p>
  }
  
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const doctorSpecialty = selectedGroup ? selectedGroup.specialties.join(', ') : (doctor?.specialty || 'Multiple');


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
                <p className="text-2xl font-bold">{patientsLoading ? <Loader className="h-6 w-6 animate-spin" /> : stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
             <CardHeader>
                <div className="flex items-center gap-4 flex-wrap">
                    <Button variant={selectedGroupId === 'all' ? 'default' : 'ghost'} onClick={() => setSelectedGroupId('all')}>ALL GROUPS</Button>
                    {groups.map(group => (
                        <Button key={group.id} variant={selectedGroupId === group.id ? 'default' : 'ghost'} onClick={() => setSelectedGroupId(group.id)}>{group.name.toUpperCase()}</Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-bold">Performance Details</h3>
                <p className="text-sm text-muted-foreground mb-4">GROUP CONTEXT: {selectedGroupId === 'all' ? 'ALL ASSIGNED WINGS' : (groups.find(g=>g.id === selectedGroupId)?.name || '').toUpperCase()}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">CURRENTLY ACTIVE AT</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold">Not logged into any rooms</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">QUEUE SUMMARY</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <div>
                                <p>Next Token:</p>
                                <p>Avg Wait Time:</p>
                            </div>
                             <div className="text-right">
                                <p className="font-bold text-primary">{nextToken?.tokenNumber || 'N/A'}</p>
                                <p className="font-bold text-primary">~15m</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/50 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold text-primary">0%</p>
                        <p className="text-xs text-muted-foreground">EFFICIENCY</p>
                    </Card>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-primary text-primary-foreground relative overflow-hidden h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90" asChild>
                <Link href={`/doctor/${doctor.id}/consultation`}>START CONSULTATIONS</Link>
              </Button>
              <div className="bg-primary-foreground/20 p-3 rounded-lg">
                <p className="font-bold text-white">Dr. {doctor.name}</p>
                <p className="text-xs text-primary-foreground/80">SPECIALTY: {doctorSpecialty}</p>
              </div>
            </CardContent>
            <Stethoscope className="absolute -right-8 -bottom-8 h-40 w-40 text-primary-foreground/10" />
          </Card>
        </div>
      </div>
    </div>
  );
}
