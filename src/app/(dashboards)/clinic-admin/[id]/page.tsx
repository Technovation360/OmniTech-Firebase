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
import { getClinicGroupById, getPatientsByClinicId } from '@/lib/data';
import { use, useState, useEffect } from 'react';
import { ClinicGroup, Patient } from '@/lib/types';

function InsightsTab({ patients }: { patients: Patient[] }) {
    const totalPatients = patients.length;
    const inWaiting = patients.filter(p => p.status === 'waiting' || p.status === 'called').length;
    const attended = patients.filter(p => p.status === 'consultation-done').length;
    const skipped = patients.filter(p => p.status === 'no-show').length;

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
  const [clinic, setClinic] = useState<ClinicGroup | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    getClinicGroupById(id).then((data) => {
      setClinic(data ?? null);
    });
    getPatientsByClinicId(id).then(setPatients);
  }, [id]);

  if (!clinic) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline">Clinic Admin Dashboard</h1>
       <p className="text-muted-foreground">Welcome to the dashboard for {clinic.name}.</p>
       <div className="pt-4">
        <InsightsTab patients={patients} />
       </div>
    </div>
  );
}
