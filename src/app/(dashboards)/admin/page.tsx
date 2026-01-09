'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building, Ticket, Megaphone, Film } from 'lucide-react';

const stats = [
    { title: "CLINICS", value: "2", icon: Building },
    { title: "ACTIVE TOKENS", value: "3", icon: Ticket },
    { title: "ADVERTISERS", value: "2", icon: Megaphone },
    { title: "CAMPAIGNS", value: "2", icon: Film },
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
            <div className="p-3 bg-accent rounded-md">
               <stat.icon className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="text-4xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold font-headline">Central Admin Dashboard</h1>
       <p className="text-muted-foreground">Welcome to the central hub for managing the OmniToken platform.</p>
       <InsightsTab />
    </div>
  );
}
