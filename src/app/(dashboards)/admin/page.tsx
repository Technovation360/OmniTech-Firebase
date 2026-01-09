'use client';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Building, Ticket, Megaphone, Film } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const stats = [
    { title: "CLINICS", value: "1", icon: Building },
    { title: "ACTIVE TOKENS", value: "31", icon: Ticket },
    { title: "ADVERTISERS", value: "2", icon: Megaphone },
    { title: "CAMPAIGNS", value: "2", icon: Film },
];

export default function AdminPage() {
  const { setOpen } = useSidebar();

  // This is a workaround to keep sidebar open on this page as per the design
  // In a real app this might be handled differently, e.g. based on user preference
  // or screen size.
  typeof window !== 'undefined' && window.setTimeout(() => setOpen(true), 1);


  return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <div className="p-3 bg-accent rounded-md">
                 <stat.icon className="h-5 w-5 text-accent-foreground" />
               </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">{stat.title}</div>
              <div className="text-4xl font-bold mt-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
  );
}
