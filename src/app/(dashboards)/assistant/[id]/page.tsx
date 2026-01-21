
'use client';

import { use, useState, useEffect, useMemo } from 'react';
import type { Patient, Group, User } from '@/lib/types';
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
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';


type AssistantPageProps = {
  params: { id: string };
};


export default function AssistantPageLoader({ params }: AssistantPageProps) {
  const { id } = use(params);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const assistantUserRef = useMemoFirebase(() => {
    return doc(firestore, 'users', id);
  }, [firestore, id]);
  const { data: assistantUser, isLoading: assistantUserLoading } = useDoc<User>(assistantUserRef);

  const assistantGroupsQuery = useMemoFirebase(() => {
    if (!assistantUser) return null;
    return query(collection(firestore, "groups"), where("assistants", "array-contains", { id: id, name: assistantUser.name }));
  }, [firestore, id, assistantUser]);

  const {data: assistantGroups, isLoading: groupsLoading} = useCollection<Group>(assistantGroupsQuery);

  if (isUserLoading || assistantUserLoading || groupsLoading) {
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

  return (
    <AssistantDashboard
      assistantId={id}
      groups={assistantGroups}
    />
  );
}

function AssistantDashboard({
  assistantId,
  groups,
}: {
  assistantId: string;
  groups: Group[];
}) {
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const firestore = useFirestore();
  const assistant = groups.flatMap(g => g.assistants).find(d => d.id === assistantId);

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
  
  if (!assistant) {
    return <p>Assistant not found in this group.</p>
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Assistant Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {assistant.name}.</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
