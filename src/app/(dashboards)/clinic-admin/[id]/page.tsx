
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building, Ticket, Users, UserPlus } from 'lucide-react';
import { getClinicGroupById } from '@/lib/data';
import { useState, useEffect } from 'react';
import { ClinicGroup } from '@/lib/types';
import { Loader } from 'lucide-react';

const stats = [
    { title: "ACTIVE TOKENS", value: "3", icon: Ticket },
    { title: "STAFF", value: "2", icon: Users },
    { title: "PATIENTS TODAY", value: "3", icon: UserPlus },
];

function InsightsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
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
  )
}

export default function ClinicAdminPage({ params: { id } }: { params: { id: string } }) {
  const [clinic, setClinic] = useState<ClinicGroup | null>(null);

  useEffect(() => {
    getClinicGroupById(id).then(setClinic);
  }, [id]);

  if (!clinic) {
    return <div className="flex items-center justify-center h-full"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline">Welcome to {clinic.name}</h1>
       <p className="text-muted-foreground">This is your dashboard for managing clinic operations.</p>
       <div className="max-w-4xl mx-auto">
        <InsightsTab />
       </div>
    </div>
  );
}
