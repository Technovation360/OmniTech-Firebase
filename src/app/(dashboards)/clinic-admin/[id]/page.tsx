
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import { use, useState, useEffect } from 'react';
import { Clinic, Patient } from '@/lib/types';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';

function InsightsTab({ clinicId }: { clinicId: string }) {
    const firestore = useFirestore();

    const patientsQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'patients'), where('clinicId', '==', clinicId));
    }, [firestore, clinicId]);

    const { data: patients, isLoading } = useCollection<Patient>(patientsQuery);

    if (isLoading) {
        return (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-9 w-12 bg-gray-200 rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const totalPatients = patients?.length || 0;
    const inWaiting = patients?.filter(p => p.status === 'waiting' || p.status === 'called').length || 0;
    const attended = patients?.filter(p => p.status === 'consultation-done').length || 0;
    const skipped = patients?.filter(p => p.status === 'no-show').length || 0;

    const stats = [
      { title: 'TOTAL PATIENTS', value: totalPatients, icon: Users },
      { title: 'IN WAITING', value: inWaiting, icon: Clock },
      { title: 'ATTENDED', value: attended, icon: CheckCircle },
      { title: 'SKIPPED', value: skipped, icon: XCircle },
    ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
             <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
             <stat.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ClinicAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const firestore = useFirestore();

  const clinicRef = useMemoFirebase(() => {
    return doc(firestore, 'groups', id);
  }, [firestore, id]);

  const { data: clinic, isLoading } = useDoc<Clinic>(clinicRef);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
        <div className="space-y-6 text-center">
            <h1 className="text-3xl font-bold font-headline">Clinic Not Found</h1>
            <p className="text-muted-foreground">The requested clinic could not be found.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline">Clinic Admin Dashboard</h1>
       <p className="text-muted-foreground">Welcome to the dashboard for {clinic.name}.</p>
       <div className="pt-4">
        <InsightsTab clinicId={id} />
       </div>
    </div>
  );
}
