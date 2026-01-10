
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
import { getClinicGroupById } from '@/lib/data';
import { use, useState, useEffect } from 'react';
import { ClinicGroup } from '@/lib/types';

const stats = [
  { title: 'TOTAL PATIENTS', value: '30', icon: Users },
  { title: 'IN WAITING', value: '30', icon: Clock },
  { title: 'ATTENDED', value: '0', icon: CheckCircle },
  { title: 'SKIPPED', value: '0', icon: XCircle },
];

function InsightsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm">
          <CardHeader className="pb-2 text-center">
             <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-4">
            <div className="p-3 bg-accent rounded-full">
               <stat.icon className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="text-4xl font-bold">{stat.value}</div>
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

  useEffect(() => {
    getClinicGroupById(id).then((data) => {
      // If data is undefined, we default to null to match the state type
      setClinic(data ?? null);
    });
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
       <div className="max-w-4xl mx-auto pt-4">
        <InsightsTab />
       </div>
    </div>
  );
}
